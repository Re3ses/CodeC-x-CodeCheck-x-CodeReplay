const { connectToDatabase, closeDatabaseConnection } = require('../../helper/helper');
const mongoose = require('mongoose');
const { UserService, CoderoomService, ProblemService, AttemptTrackerService } = require('../../../services');

let test_user_learner_1;
let test_user_learner_2
let test_user_mentor;
let test_coderoom_1;
let test_coderoom_2;
let test_problem_1;
let test_problem_2;

beforeEach(async () => {
    await connectToDatabase();

    test_user_learner_1 = await UserService.register({
        first_name: "Albert",
        last_name: "Perez",
        type: "Learner",
        username: "albert",
        password: "password",
        email: "aebp14@gmail.com"
    });

    test_user_learner_2 = await UserService.register({
        first_name: "Albert2",
        last_name: "Perez",
        type: "Learner",
        username: "albert2",
        password: "password",
        email: "aebp14444@gmail.com"
    });

    test_user_mentor = await UserService.register({
        first_name: "Angel",
        last_name: "Basbas",
        type: "Mentor",
        username: "einjeru",
        password: "password",
        email: "albperez.home@gmail.com"
    });

    test_problem_1 = await ProblemService.publish({
        name: "Test Problem 1",
        description: "This is a test problem",
        input_format: "This is the input format",
        output_format: "This is the output format",
        constraints: "This is the constraints",
        release: Date.now(),
        deadline: Date.now(),
        difficulty: "Easy",
        languages: [
            {
                name: "Python",
                code_snippet: "print('Hello World!')",
                time_complexity: 1,
                space_complexity: 1
            }
        ],
        test_cases: [
            {
                input: "1",
                output: "1"
            }
        ],
        mentor: test_user_mentor.auth.username,
    });

    test_problem_2 = await ProblemService.publish({
        name: "Test Problem 2",
        description: "This is a test problem",
        input_format: "This is the input format",
        output_format: "This is the output format",
        constraints: "This is the constraints",
        release: Date.now(),
        deadline: Date.now(),
        difficulty: "Easy",
        languages: [
            {
                name: "Python",
                code_snippet: "print('Hello World!')",
                time_complexity: 1,
                space_complexity: 1
            }
        ],
        test_cases: [
            {
                input: "1",
                output: "1"
            }
        ],
        mentor: test_user_mentor.auth.username,
    });
    
    test_coderoom_1 = await CoderoomService.publish({
        name: "Test Coderoom",
        description: "This is a test coderoom",
        type: "Competitive",
        mentor: test_user_mentor.auth.username,
    });

    test_coderoom_2 = await CoderoomService.publish({
        name: "Test Coderoom 2",
        description: "This is a test coderoom 2",
        type: "Competitive",
        mentor: test_user_mentor.auth.username,
    });
});

afterAll(async () => {
    await closeDatabaseConnection();
});

describe("When a user attempts a problem", () => {
    it("Should create attempt in a room in a problem", async() => {
        await CoderoomService.enroll(test_coderoom_1.slug, test_user_learner_1.auth.username);
        const attempt = await AttemptTrackerService.attempt({
            learner: test_user_learner_1.auth.username,
            problem: test_problem_1.slug,
            room: test_coderoom_1.slug,
        });
        expect(attempt).toHaveProperty("_id");
    });

    it("Should not create attempt in a room in a nonexistent problem", async() => {
        await CoderoomService.enroll(test_coderoom_1.slug, test_user_learner_1.auth.username);
        const attempt = await AttemptTrackerService.attempt({
            learner: test_user_learner_1.auth.username,
            problem: "invalid slug",
            room: test_coderoom_1.slug,
        });
        expect(attempt).toBeNull();
    });

    it("Should not create attempt in a nonexistent room and problem", async() => {
        const attempt = await AttemptTrackerService.attempt({
            learner: test_user_learner_1.auth.username,
            problem: "invalid slug",
            room: "invalid slug",
        });
        expect(attempt).toBeNull();
    });
});

describe("When a user has an attempt", () => {
    it("Should get attempt by id", async() => {
        await CoderoomService.enroll(test_coderoom_1.slug, test_user_learner_1.auth.username);
        const attempt = await AttemptTrackerService.attempt({
            learner: test_user_learner_1.auth.username,
            problem: test_problem_1.slug,
            room: test_coderoom_1.slug,
        });
        const attempt2 = await AttemptTrackerService.serial(attempt._id);
        expect(attempt2).toHaveProperty("_id");
    });

    it("Should return undefined attempt by invalid id", async() => {
        const attempt = await AttemptTrackerService.serial("invalid id");
        expect(attempt).toBe(undefined);
    });
});

describe("When a user has many attempts in multiple rooms with different problems", () => {
    it("Should list attempts by user", async() => {
        await CoderoomService.enroll(test_coderoom_1.slug, test_user_learner_1.auth.username);
        await CoderoomService.enroll(test_coderoom_2.slug, test_user_learner_1.auth.username);
        
        await CoderoomService.enroll(test_coderoom_1.slug, test_user_learner_2.auth.username);

        await AttemptTrackerService.attempt({
            learner: test_user_learner_1.auth.username,
            problem: test_problem_1.slug,
            room: test_coderoom_1.slug,
        });
        await AttemptTrackerService.attempt({
            learner: test_user_learner_1.auth.username,
            problem: test_problem_2.slug,
            room: test_coderoom_2.slug,
        });
        const attempts = await AttemptTrackerService.listAttemptsOf(test_user_learner_1.auth.username);
        expect(attempts).toHaveLength(2);
    });

    it("Should not list attempts by another user", async() => {
        await CoderoomService.enroll(test_coderoom_1.slug, test_user_learner_1.auth.username);
        await CoderoomService.enroll(test_coderoom_2.slug, test_user_learner_1.auth.username);
        
        await CoderoomService.enroll(test_coderoom_1.slug, test_user_learner_2.auth.username);

        await AttemptTrackerService.attempt({
            learner: test_user_learner_1.auth.username,
            problem: test_problem_1.slug,
            room: test_coderoom_1.slug,
        });
        await AttemptTrackerService.attempt({
            learner: test_user_learner_1.auth.username,
            problem: test_problem_2.slug,
            room: test_coderoom_2.slug,
        });
        const attempts = await AttemptTrackerService.listAttemptsOf(test_user_learner_2.auth.username);
        expect(attempts).toHaveLength(0);
    });
});

describe("When a problem is attempted by many users in a room", () => {
    it("Should list attempts in a room", async() => {
        await CoderoomService.enroll(test_coderoom_1.slug, test_user_learner_1.auth.username);
        await CoderoomService.enroll(test_coderoom_1.slug, test_user_learner_2.auth.username);
        
        await CoderoomService.enroll(test_coderoom_2.slug, test_user_learner_1.auth.username);

        await AttemptTrackerService.attempt({
            learner: test_user_learner_1.auth.username,
            problem: test_problem_1.slug,
            room: test_coderoom_1.slug,
        });
        await AttemptTrackerService.attempt({
            learner: test_user_learner_2.auth.username,
            problem: test_problem_1.slug,
            room: test_coderoom_1.slug,
        });
        const attempts = await AttemptTrackerService.listAttemptsFrom(test_coderoom_1.slug);
        expect(attempts).toHaveLength(2);
    });

    it("Should not list attempts in a nonexistent room", async() => {
        const attempts = await AttemptTrackerService.listAttemptsFrom("invalid slug");
        expect(attempts).toHaveLength(0);
    });
});

describe("When a problem is attempted by many users in multiple rooms", () => {
    it("Should list attempts in a problem", async() => {
        await CoderoomService.enroll(test_coderoom_1.slug, test_user_learner_1.auth.username);
        await CoderoomService.enroll(test_coderoom_2.slug, test_user_learner_1.auth.username);
        
        await CoderoomService.enroll(test_coderoom_1.slug, test_user_learner_2.auth.username);

        await AttemptTrackerService.attempt({
            learner: test_user_learner_1.auth.username,
            problem: test_problem_1.slug,
            room: test_coderoom_1.slug,
        });
        await AttemptTrackerService.attempt({
            learner: test_user_learner_1.auth.username,
            problem: test_problem_1.slug,
            room: test_coderoom_2.slug,
        });
        const attempts = await AttemptTrackerService.listAttemptsIn(test_problem_1.slug);
        expect(attempts).toHaveLength(2);
    });

    it("Should not list attempts in a nonexistent problem", async() => {
        const attempts = await AttemptTrackerService.listAttemptsIn("invalid slug");
        expect(attempts).toHaveLength(0);
    });
});

describe("When a user has many attempts in a room in a problem", () => {
    it("Should list attempts of a user in a problem in a room", async() => {
        await CoderoomService.enroll(test_coderoom_1.slug, test_user_learner_1.auth.username);
        await CoderoomService.enroll(test_coderoom_1.slug, test_user_learner_2.auth.username);
        
        await CoderoomService.enroll(test_coderoom_2.slug, test_user_learner_1.auth.username);

        await AttemptTrackerService.attempt({
            learner: test_user_learner_1.auth.username,
            problem: test_problem_1.slug,
            room: test_coderoom_1.slug,
        });
        await AttemptTrackerService.attempt({
            learner: test_user_learner_1.auth.username,
            problem: test_problem_1.slug,
            room: test_coderoom_2.slug,
        });
        await AttemptTrackerService.attempt({
            learner: test_user_learner_2.auth.username,
            problem: test_problem_1.slug,
            room: test_coderoom_1.slug,
        });
        const attempts = await AttemptTrackerService.listAttemptsOfInFrom(test_user_learner_1.auth.username, test_problem_1.slug, test_coderoom_1.slug);
        expect(attempts).toHaveLength(1);
    });

    it("Should not list attempts of a user in a nonexistent problem in a room", async() => {
        const attempts = await AttemptTrackerService.listAttemptsOfInFrom(test_user_learner_1.auth.username, "invalid slug", test_coderoom_1.slug);
        expect(attempts).toHaveLength(0);
    });

    it("Should not list attempts of a user in a problem in a nonexistent room", async() => {
        const attempts = await AttemptTrackerService.listAttemptsOfInFrom(test_user_learner_1.auth.username, test_problem_1.slug, "invalid slug");
        expect(attempts).toHaveLength(0);
    });
});
