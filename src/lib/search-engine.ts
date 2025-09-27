// Advanced Search Engine
// Implements sophisticated search and filtering with skill matching

export interface SearchFilters {
  query?: string;
  skills?: string[];
  departments?: string[];
  stipendMin?: number;
  stipendMax?: number;
  type?: 'internship' | 'placement' | 'both';
  location?: string[];
  duration?: 'short' | 'medium' | 'long'; // weeks: 1-8, 9-16, 17+
  companies?: string[];
  rating?: number; // minimum rating
  datePosted?: 'today' | 'week' | 'month' | 'all';
  sortBy?: 'relevance' | 'date' | 'stipend' | 'rating' | 'applications';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  id: number;
  title: string;
  description: string;
  company: string;
  skills: string[];
  departments: string[];
  stipend: { min: number; max: number };
  type: 'internship' | 'placement';
  location?: string;
  duration?: number; // weeks
  rating?: number;
  applicationsCount?: number;
  postedDate: string;
  relevanceScore: number;
  matchingSkills: string[];
  matchPercentage: number;
}

export interface SearchSuggestions {
  skills: string[];
  companies: string[];
  locations: string[];
  recentSearches: string[];
}

export interface SearchAnalytics {
  totalResults: number;
  searchTime: number;
  filters: SearchFilters;
  popularFilters: Record<string, any>;
  suggestedRefinements: string[];
}

export class SearchEngine {
  
  /**
   * Main search function with advanced filtering
   */
  static async search(
    filters: SearchFilters,
    userSkills: string[] = [],
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    results: SearchResult[];
    analytics: SearchAnalytics;
    suggestions: SearchSuggestions;
  }> {
    const startTime = Date.now();
    
    // Get all internships (in production, this would be a database query)
    const allInternships = await this.getAllInternships();
    
    // Apply filters
    let filteredResults = this.applyFilters(allInternships, filters);
    
    // Calculate relevance scores
    filteredResults = this.calculateRelevanceScores(filteredResults, filters, userSkills);
    
    // Sort results
    filteredResults = this.sortResults(filteredResults, filters.sortBy || 'relevance', filters.sortOrder || 'desc');
    
    // Paginate
    const paginatedResults = filteredResults.slice(offset, offset + limit);
    
    // Generate analytics
    const analytics: SearchAnalytics = {
      totalResults: filteredResults.length,
      searchTime: Date.now() - startTime,
      filters,
      popularFilters: this.getPopularFilters(),
      suggestedRefinements: this.generateRefinementSuggestions(filteredResults, filters)
    };
    
    // Generate suggestions
    const suggestions = await this.generateSuggestions(filters.query || '');
    
    return {
      results: paginatedResults,
      analytics,
      suggestions
    };
  }
  
  /**
   * Smart skill-based search
   */
  static searchBySkills(
    userSkills: string[],
    additionalFilters?: Partial<SearchFilters>
  ): Promise<{
    results: SearchResult[];
    analytics: SearchAnalytics;
    suggestions: SearchSuggestions;
  }> {
    const filters: SearchFilters = {
      skills: userSkills,
      sortBy: 'relevance',
      ...additionalFilters
    };
    
    return this.search(filters, userSkills);
  }
  
  /**
   * Get search suggestions as user types
   */
  static async getAutocompleteSuggestions(query: string, type: 'all' | 'skills' | 'companies' | 'titles' = 'all'): Promise<{
    suggestions: string[];
    categories: Record<string, string[]>;
  }> {
    const allInternships = await this.getAllInternships();
    const suggestions: string[] = [];
    const categories: Record<string, string[]> = {
      skills: [],
      companies: [],
      titles: []
    };
    
    const queryLower = query.toLowerCase();
    
    if (type === 'all' || type === 'skills') {
      const skillSuggestions = this.extractUniqueSkills(allInternships)
        .filter(skill => skill.toLowerCase().includes(queryLower))
        .slice(0, 5);
      categories.skills = skillSuggestions;
      suggestions.push(...skillSuggestions);
    }
    
    if (type === 'all' || type === 'companies') {
      const companySuggestions = this.extractUniqueCompanies(allInternships)
        .filter(company => company.toLowerCase().includes(queryLower))
        .slice(0, 5);
      categories.companies = companySuggestions;
      suggestions.push(...companySuggestions);
    }
    
    if (type === 'all' || type === 'titles') {
      const titleSuggestions = allInternships
        .map(internship => internship.title)
        .filter(title => title.toLowerCase().includes(queryLower))
        .slice(0, 5);
      categories.titles = titleSuggestions;
      suggestions.push(...titleSuggestions);
    }
    
    return {
      suggestions: [...new Set(suggestions)].slice(0, 10),
      categories
    };
  }
  
  /**
   * Apply all filters to internship list
   */
  private static applyFilters(internships: any[], filters: SearchFilters): SearchResult[] {
    return internships.filter(internship => {
      // Text query filter
      if (filters.query) {
        const queryLower = filters.query.toLowerCase();
        const searchableText = [
          internship.title,
          internship.description,
          internship.company,
          ...internship.skills
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(queryLower)) {
          return false;
        }
      }
      
      // Skills filter
      if (filters.skills && filters.skills.length > 0) {
        const hasMatchingSkill = filters.skills.some(skill =>
          internship.skills.some((internshipSkill: string) =>
            internshipSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(internshipSkill.toLowerCase())
          )
        );
        if (!hasMatchingSkill) return false;
      }
      
      // Department filter
      if (filters.departments && filters.departments.length > 0) {
        const hasMatchingDepartment = filters.departments.some(dept =>
          internship.departments.includes(dept)
        );
        if (!hasMatchingDepartment) return false;
      }
      
      // Stipend filter
      if (filters.stipendMin && internship.stipend.max < filters.stipendMin) {
        return false;
      }
      if (filters.stipendMax && internship.stipend.min > filters.stipendMax) {
        return false;
      }
      
      // Type filter
      if (filters.type && filters.type !== 'both') {
        if (filters.type !== internship.type) return false;
      }
      
      // Location filter
      if (filters.location && filters.location.length > 0) {
        if (!internship.location || !filters.location.includes(internship.location)) {
          return false;
        }
      }
      
      // Duration filter
      if (filters.duration && internship.duration) {
        const duration = internship.duration;
        switch (filters.duration) {
          case 'short':
            if (duration > 8) return false;
            break;
          case 'medium':
            if (duration <= 8 || duration > 16) return false;
            break;
          case 'long':
            if (duration <= 16) return false;
            break;
        }
      }
      
      // Company filter
      if (filters.companies && filters.companies.length > 0) {
        if (!filters.companies.includes(internship.company)) return false;
      }
      
      // Rating filter
      if (filters.rating && internship.rating && internship.rating < filters.rating) {
        return false;
      }
      
      // Date posted filter
      if (filters.datePosted && filters.datePosted !== 'all') {
        const postedDate = new Date(internship.postedDate);
        const now = new Date();
        const daysDiff = (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24);
        
        switch (filters.datePosted) {
          case 'today':
            if (daysDiff > 1) return false;
            break;
          case 'week':
            if (daysDiff > 7) return false;
            break;
          case 'month':
            if (daysDiff > 30) return false;
            break;
        }
      }
      
      return true;
    }).map(internship => this.transformToSearchResult(internship));
  }
  
  /**
   * Calculate relevance scores for search results
   */
  private static calculateRelevanceScores(
    results: SearchResult[],
    filters: SearchFilters,
    userSkills: string[]
  ): SearchResult[] {
    return results.map(result => {
      let score = 0;
      const matchingSkills: string[] = [];
      
      // Base score for having results
      score += 10;
      
      // Text query relevance
      if (filters.query) {
        const queryLower = filters.query.toLowerCase();
        
        // Title match (highest weight)
        if (result.title.toLowerCase().includes(queryLower)) {
          score += 50;
        }
        
        // Company match
        if (result.company.toLowerCase().includes(queryLower)) {
          score += 30;
        }
        
        // Description match
        if (result.description.toLowerCase().includes(queryLower)) {
          score += 20;
        }
        
        // Skills match
        result.skills.forEach(skill => {
          if (skill.toLowerCase().includes(queryLower)) {
            score += 15;
            matchingSkills.push(skill);
          }
        });
      }
      
      // User skills matching
      if (userSkills.length > 0) {
        userSkills.forEach(userSkill => {
          result.skills.forEach(jobSkill => {
            if (userSkill.toLowerCase() === jobSkill.toLowerCase()) {
              score += 40; // Exact match
              if (!matchingSkills.includes(jobSkill)) {
                matchingSkills.push(jobSkill);
              }
            } else if (
              userSkill.toLowerCase().includes(jobSkill.toLowerCase()) ||
              jobSkill.toLowerCase().includes(userSkill.toLowerCase())
            ) {
              score += 20; // Partial match
              if (!matchingSkills.includes(jobSkill)) {
                matchingSkills.push(jobSkill);
              }
            }
          });
        });
      }
      
      // Recency bonus
      const daysSincePosted = (Date.now() - new Date(result.postedDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePosted <= 7) score += 15;
      else if (daysSincePosted <= 30) score += 10;
      
      // Rating bonus
      if (result.rating) {
        score += result.rating * 5;
      }
      
      // Application popularity (inverse - less crowded positions get bonus)
      if (result.applicationsCount !== undefined) {
        if (result.applicationsCount < 10) score += 10;
        else if (result.applicationsCount > 50) score -= 5;
      }
      
      // Calculate match percentage
      const totalSkills = result.skills.length;
      const matchPercentage = totalSkills > 0 ? (matchingSkills.length / totalSkills) * 100 : 0;
      
      return {
        ...result,
        relevanceScore: Math.round(score),
        matchingSkills,
        matchPercentage: Math.round(matchPercentage)
      };
    });
  }
  
  /**
   * Sort search results
   */
  private static sortResults(
    results: SearchResult[],
    sortBy: string,
    sortOrder: string
  ): SearchResult[] {
    const sortedResults = [...results].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'relevance':
          comparison = b.relevanceScore - a.relevanceScore;
          break;
        case 'date':
          comparison = new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
          break;
        case 'stipend':
          comparison = (b.stipend.max + b.stipend.min) / 2 - (a.stipend.max + a.stipend.min) / 2;
          break;
        case 'rating':
          comparison = (b.rating || 0) - (a.rating || 0);
          break;
        case 'applications':
          comparison = (a.applicationsCount || 0) - (b.applicationsCount || 0);
          break;
        default:
          comparison = b.relevanceScore - a.relevanceScore;
      }
      
      return sortOrder === 'asc' ? -comparison : comparison;
    });
    
    return sortedResults;
  }
  
  /**
   * Mock data - in production, this would query the database
   */
  private static async getAllInternships(): Promise<any[]> {
    // Mock internship data
    return [
      {
        id: 1,
        title: 'Frontend Developer Intern',
        description: 'Work on React applications with modern tools and frameworks. Learn from senior developers.',
        company: 'Tech Solutions Pvt Ltd',
        skills: ['React', 'JavaScript', 'HTML', 'CSS', 'TypeScript'],
        departments: ['Computer Science', 'Information Technology'],
        stipend: { min: 15000, max: 25000 },
        type: 'internship',
        location: 'Jaipur',
        duration: 12,
        rating: 4.5,
        applicationsCount: 23,
        postedDate: '2024-01-20'
      },
      {
        id: 2,
        title: 'Full Stack Developer',
        description: 'Complete web development role with Node.js and React. Full-time opportunity after internship.',
        company: 'Digital Innovations',
        skills: ['Node.js', 'React', 'MongoDB', 'Express', 'JavaScript'],
        departments: ['Computer Science', 'Information Technology'],
        stipend: { min: 20000, max: 35000 },
        type: 'placement',
        location: 'Jaipur',
        duration: 24,
        rating: 4.3,
        applicationsCount: 45,
        postedDate: '2024-01-18'
      },
      {
        id: 3,
        title: 'Data Science Intern',
        description: 'Work with Python, machine learning, and data analysis. Hands-on experience with real datasets.',
        company: 'Analytics Corp',
        skills: ['Python', 'Machine Learning', 'Data Analysis', 'SQL', 'TensorFlow'],
        departments: ['Computer Science', 'Information Technology'],
        stipend: { min: 18000, max: 28000 },
        type: 'internship',
        location: 'Jaipur',
        duration: 16,
        rating: 4.7,
        applicationsCount: 67,
        postedDate: '2024-01-15'
      }
    ];
  }
  
  private static transformToSearchResult(internship: any): SearchResult {
    return {
      id: internship.id,
      title: internship.title,
      description: internship.description,
      company: internship.company,
      skills: internship.skills,
      departments: internship.departments,
      stipend: internship.stipend,
      type: internship.type,
      location: internship.location,
      duration: internship.duration,
      rating: internship.rating,
      applicationsCount: internship.applicationsCount,
      postedDate: internship.postedDate,
      relevanceScore: 0,
      matchingSkills: [],
      matchPercentage: 0
    };
  }
  
  private static extractUniqueSkills(internships: any[]): string[] {
    const allSkills = internships.flatMap(internship => internship.skills);
    return [...new Set(allSkills)].sort();
  }
  
  private static extractUniqueCompanies(internships: any[]): string[] {
    const allCompanies = internships.map(internship => internship.company);
    return [...new Set(allCompanies)].sort();
  }
  
  private static getPopularFilters(): Record<string, any> {
    // Mock popular filters - in production, track user behavior
    return {
      mostSearchedSkills: ['React', 'JavaScript', 'Python', 'Java', 'Node.js'],
      popularStipendRange: { min: 15000, max: 30000 },
      preferredLocations: ['Jaipur', 'Udaipur', 'Jodhpur'],
      popularDuration: 'medium'
    };
  }
  
  private static generateRefinementSuggestions(results: SearchResult[], filters: SearchFilters): string[] {
    const suggestions = [];
    
    if (results.length > 50) {
      suggestions.push('Add more specific skills to narrow results');
      suggestions.push('Filter by stipend range');
    }
    
    if (results.length < 5) {
      suggestions.push('Try broader skill terms');
      suggestions.push('Remove some filters');
    }
    
    if (!filters.skills || filters.skills.length === 0) {
      suggestions.push('Add skills to get better matches');
    }
    
    return suggestions;
  }
  
  private static async generateSuggestions(query: string): Promise<SearchSuggestions> {
    // Mock suggestions - in production, track user searches and popular terms
    return {
      skills: ['React', 'JavaScript', 'Python', 'Java', 'Node.js', 'Machine Learning'],
      companies: ['Tech Solutions', 'Digital Innovations', 'Analytics Corp', 'Software Systems'],
      locations: ['Jaipur', 'Udaipur', 'Jodhpur', 'Kota', 'Ajmer'],
      recentSearches: ['React developer', 'Python internship', 'Data science', 'Full stack']
    };
  }
}