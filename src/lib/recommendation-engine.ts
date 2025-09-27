// Recommendation Engine for Smart Internship Matching
// This service implements the "recommendation engine that surfaces best-fit roles to each learner"

interface Student {
  id: number;
  skills: string[];
  department: string;
  current_semester: number;
  preferences?: {
    stipend_min?: number;
    work_type?: 'internship' | 'placement' | 'both';
    location_preference?: string[];
  };
}

interface Internship {
  id: number;
  title: string;
  required_skills: string[];
  eligible_departments: string[];
  stipend_min: number;
  stipend_max: number;
  is_placement: boolean;
  description: string;
}

interface RecommendationScore {
  internship_id: number;
  score: number;
  match_reasons: string[];
  skill_match_percentage: number;
  department_match: boolean;
}

export class RecommendationEngine {
  
  /**
   * Calculate recommendation score for a student-internship pair
   */
  static calculateMatchScore(student: Student, internship: Internship): RecommendationScore {
    let score = 0;
    const matchReasons: string[] = [];
    
    // 1. Department eligibility (mandatory - 40 points)
    const departmentMatch = internship.eligible_departments.includes(student.department);
    if (departmentMatch) {
      score += 40;
      matchReasons.push(`Eligible for ${student.department} students`);
    } else {
      // No match if department not eligible
      return {
        internship_id: internship.id,
        score: 0,
        match_reasons: ['Not eligible for your department'],
        skill_match_percentage: 0,
        department_match: false
      };
    }
    
    // 2. Skills matching (30 points max)
    const studentSkills = student.skills.map(s => s.toLowerCase());
    const requiredSkills = internship.required_skills.map(s => s.toLowerCase());
    
    const matchingSkills = requiredSkills.filter(skill => 
      studentSkills.some(studentSkill => 
        studentSkill.includes(skill) || skill.includes(studentSkill)
      )
    );
    
    const skillMatchPercentage = requiredSkills.length > 0 
      ? (matchingSkills.length / requiredSkills.length) * 100 
      : 0;
    
    const skillScore = Math.round((skillMatchPercentage / 100) * 30);
    score += skillScore;
    
    if (matchingSkills.length > 0) {
      matchReasons.push(`${matchingSkills.length}/${requiredSkills.length} skills match (${Math.round(skillMatchPercentage)}%)`);
    }
    
    // 3. Semester/Experience level (15 points max)
    if (student.current_semester >= 6) {
      score += 15;
      matchReasons.push('Good experience level for internships');
    } else if (student.current_semester >= 4) {
      score += 10;
      matchReasons.push('Adequate experience level');
    } else {
      score += 5;
      matchReasons.push('Early semester - good learning opportunity');
    }
    
    // 4. Internship vs Placement preference (10 points max)
    if (student.preferences?.work_type === 'both' || !student.preferences?.work_type) {
      score += 5;
    } else if (
      (student.preferences.work_type === 'internship' && !internship.is_placement) ||
      (student.preferences.work_type === 'placement' && internship.is_placement)
    ) {
      score += 10;
      matchReasons.push(`Matches your ${student.preferences.work_type} preference`);
    }
    
    // 5. Stipend match (5 points max)
    if (student.preferences?.stipend_min) {
      if (internship.stipend_max >= student.preferences.stipend_min) {
        score += 5;
        matchReasons.push('Meets your stipend expectations');
      }
    } else {
      score += 2; // Default bonus for having stipend info
    }
    
    return {
      internship_id: internship.id,
      score,
      match_reasons: matchReasons,
      skill_match_percentage: Math.round(skillMatchPercentage),
      department_match: departmentMatch
    };
  }
  
  /**
   * Get personalized internship recommendations for a student
   */
  static getRecommendations(
    student: Student, 
    availableInternships: Internship[], 
    limit: number = 10
  ): RecommendationScore[] {
    const recommendations = availableInternships
      .map(internship => this.calculateMatchScore(student, internship))
      .filter(rec => rec.score > 0) // Only include eligible opportunities
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, limit);
    
    return recommendations;
  }
  
  /**
   * Get skill gap analysis for a student
   */
  static getSkillGapAnalysis(student: Student, targetInternship: Internship): {
    missing_skills: string[];
    matching_skills: string[];
    suggestions: string[];
  } {
    const studentSkills = student.skills.map(s => s.toLowerCase());
    const requiredSkills = targetInternship.required_skills.map(s => s.toLowerCase());
    
    const matchingSkills = requiredSkills.filter(skill => 
      studentSkills.some(studentSkill => 
        studentSkill.includes(skill) || skill.includes(studentSkill)
      )
    );
    
    const missingSkills = requiredSkills.filter(skill => !matchingSkills.includes(skill));
    
    const suggestions = [
      ...missingSkills.map(skill => `Learn ${skill} to improve your match for this role`),
      'Complete relevant online courses or certifications',
      'Work on projects that demonstrate these skills',
      'Consider related internships to build experience'
    ];
    
    return {
      missing_skills: missingSkills,
      matching_skills: matchingSkills,
      suggestions
    };
  }
  
  /**
   * Generate trending skills analysis
   */
  static getTrendingSkills(allInternships: Internship[]): {
    skill: string;
    demand_count: number;
    percentage: number;
  }[] {
    const skillCount = new Map<string, number>();
    
    allInternships.forEach(internship => {
      internship.required_skills.forEach(skill => {
        const normalizedSkill = skill.toLowerCase();
        skillCount.set(normalizedSkill, (skillCount.get(normalizedSkill) || 0) + 1);
      });
    });
    
    const totalInternships = allInternships.length;
    
    return Array.from(skillCount.entries())
      .map(([skill, count]) => ({
        skill: skill.charAt(0).toUpperCase() + skill.slice(1),
        demand_count: count,
        percentage: Math.round((count / totalInternships) * 100)
      }))
      .sort((a, b) => b.demand_count - a.demand_count)
      .slice(0, 20); // Top 20 trending skills
  }
}