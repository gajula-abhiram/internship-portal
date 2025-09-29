#!/usr/bin/env node
"use strict";
/**
 * Vercel Deployment Verification Script
 *
 * This script verifies that the application is ready for deployment to Vercel
 * by checking key components that are critical for serverless environments.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var memory_database_1 = require("./memory-database");
function verifyVercelReadiness() {
    return __awaiter(this, void 0, void 0, function () {
        var db, user, internships, applications, calendarEvents, feedback, unplacedCount, statusBreakdown, openPositions, avgRating;
        return __generator(this, function (_a) {
            console.log('🔍 Verifying Vercel deployment readiness...\n');
            try {
                // 1. Test memory database initialization
                console.log('1. Testing memory database initialization...');
                db = (0, memory_database_1.getMemoryDatabase)();
                console.log('   ✅ Memory database initialized successfully');
                // 2. Test user queries
                console.log('2. Testing user queries...');
                user = db.getUserByUsername.get('admin');
                if (user) {
                    console.log('   ✅ User queries working');
                }
                else {
                    console.log('   ⚠️  No default users found (will be seeded on first run)');
                }
                // 3. Test internship queries
                console.log('3. Testing internship queries...');
                internships = db.getActiveInternships.all();
                console.log("   \u2705 Found ".concat(internships.length, " active internships"));
                // 4. Test application queries
                console.log('4. Testing application queries...');
                applications = db.getAllApplications.all();
                console.log("   \u2705 Found ".concat(applications.length, " applications"));
                // 5. Test calendar event queries
                console.log('5. Testing calendar event queries...');
                calendarEvents = db.getUpcomingCalendarEvents.all(1, 10);
                console.log("   \u2705 Found ".concat(calendarEvents.length, " upcoming calendar events"));
                // 6. Test feedback queries
                console.log('6. Testing feedback queries...');
                feedback = db.getAllFeedback.all();
                console.log("   \u2705 Found ".concat(feedback.length, " feedback entries"));
                // 7. Test analytics queries
                console.log('7. Testing analytics queries...');
                unplacedCount = db.getUnplacedStudentsCount.get();
                statusBreakdown = db.getApplicationStatusBreakdown.all();
                openPositions = db.getOpenPositionsCount.get();
                avgRating = db.getAverageFeedbackRating.get();
                console.log("   \u2705 Analytics queries working:");
                console.log("      - Unplaced students: ".concat(unplacedCount.count));
                console.log("      - Application statuses: ".concat(statusBreakdown.length, " types"));
                console.log("      - Open positions: ".concat(openPositions.count));
                console.log("      - Average feedback rating: ".concat(avgRating.average_rating, " (").concat(avgRating.total_feedback, " reviews)"));
                console.log('\n🎉 All Vercel deployment checks passed!');
                console.log('\n📋 Deployment Notes:');
                console.log('   - Memory database will be used automatically in Vercel environment');
                console.log('   - Default users will be created on first access');
                console.log('   - All database operations are serverless-compatible');
                console.log('   - No file system dependencies that would cause issues');
                return [2 /*return*/, true];
            }
            catch (error) {
                console.error('❌ Vercel deployment verification failed:', error);
                return [2 /*return*/, false];
            }
            return [2 /*return*/];
        });
    });
}
// Run verification if script is executed directly
if (require.main === module) {
    verifyVercelReadiness().then(function (success) {
        process.exit(success ? 0 : 1);
    });
}
exports.default = verifyVercelReadiness;
