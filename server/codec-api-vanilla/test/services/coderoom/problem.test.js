const { Problem } = require("../../../models");
const { UserService, ProblemService } = require("../../../services");
const { connectToDatabase, closeDatabaseConnection } = require('../../helper/helper');
const { generate_user_learners, generate_user_mentors, generate_problems} = require("../../helper/test_data");

let test_mentor_data = generate_user_mentors()[0];
let test_learner_data = generate_user_learners()[0];
let test_problems_data = generate_problems(3);
let test_user_mentor;
let test_user_learner;
let test_problems = [];

beforeEach(async () => {
    test_problems = [];
    await connectToDatabase();
    // add user and mentor
    test_user_learner = await UserService.register(test_learner_data);
    test_user_mentor = await UserService.register(test_mentor_data);
    // add foreign keys and add test problems
    for (let i = 0; i < 2; i++) {
        test_problems_data[i]["mentor"] = test_user_mentor.auth.username;
        test_problems.push(await ProblemService.publish(test_problems_data[i]));
    }
});

afterAll(async () => {
  await closeDatabaseConnection();
});

describe("When a user creates a problem", () => {
    it ("Should create a problem if user is mentor", async() => {
        test_problems_data[2]["mentor"] = test_user_mentor.auth.username;
        const problem = await ProblemService.publish(test_problems_data[2]);
        expect(problem).toHaveProperty("_id");
    });
});

describe("When a user reads a problem", () => {
    it("Should get an existing problem by id", async() => {
        const problem = await ProblemService.serial(test_problems[0]['_id']);
        console.log(problem);
        expect(problem["slug"]).toBe(test_problems[0]["slug"]);
    });

    it("Should return null if problem id does not exist", async () => {
        const problem = await ProblemService.serial(new Problem);
        expect(problem).toBeNull;
    });

    it("Should get an existing problem by slug", async() => {
        const problem = await ProblemService.inspect(test_problems[0]['slug']);
        expect(problem["_id"]).toStrictEqual(test_problems[0]["_id"]);
    });
    
    it("Should return null if problem slug does not exist", async () => {
        const problem = await ProblemService.inspect("nonexisting-slug");
        expect(problem).toBeNull();
    });
    
});

describe("When a user reads problems", () => {
    it("Should get list of unarchived problems with no limit", async() => {
        const received_problems = await ProblemService.listProblems();
        expect(received_problems).toHaveLength(2);
    });

    it("Should get list of unarchived problems with a set limit", async () => {
        const received_problems = await ProblemService.listProblems({}, 1);
        expect(received_problems).toHaveLength(1);
    });

    it("Should get list of archived problems with no limit", async () => {
        let received_problems = await ProblemService.listProblems({"is_archived": true});
        expect(received_problems).toHaveLength(0);
    });

    it("Should get list of archived problems under a set limit", async () => {
        await ProblemService.archiving(test_problems[0]["slug"]);
        const received_problems = await ProblemService.listProblems({"is_archived": true }, 1);
        expect(received_problems).toHaveLength(1);
    });

});

describe("When a user reads problems created by a user", () => {
    it("Should get a list of problems created by a mentor with no filter and no limit", async() => {
        const received_problems = await ProblemService.listProblemsBy(test_user_mentor.auth.username);
        expect(received_problems).toHaveLength(2);
    });

    it("Should get a list of problems created by a mentor with filter but no limit", async() => {
        let received_problems = await ProblemService.listProblemsBy(test_user_mentor.auth.username, true);
        expect(received_problems).toHaveLength(0);

        await ProblemService.archiving(test_problems[0]["slug"]);
        received_problems = await ProblemService.listProblemsBy(test_user_mentor.auth.username,true);
        expect(received_problems).toHaveLength(1); 
    });

    it("Should get a list of problems created by a mentor with limit but no filter", async() => {
        const received_problems = await ProblemService.listProblemsBy(test_user_mentor.auth.username, false, 1);
        expect(received_problems).toHaveLength(1);
    });
    

    it("Should get a list of problems created by a mentor with limit and filter", async() => {
        await ProblemService.archiving(test_problems[0]["slug"]);
        await ProblemService.archiving(test_problems[1]["slug"]); 
        let received_problems = await ProblemService.listProblemsBy(test_user_mentor.auth.username, true, 1);
        expect(received_problems).toHaveLength(1);

        received_problems = await ProblemService.listProblemsBy(test_user_mentor.auth.username, true, 2);
        expect(received_problems).toHaveLength(2);
    });

    it("Should not get a list of problems created by a learner with no filter and no limit", async() => {
        const received_problems = await ProblemService.listProblemsBy(test_user_learner.username);
        expect(received_problems).toBeNull;
    });

    it("Should not get a list of problems created by a learner with filter but no limit", async() => {
        await ProblemService.archiving(test_problems[0]["slug"]);
        const received_problems = await ProblemService.listProblemsBy(test_user_learner.username);
        expect(received_problems).toBeNull;
    });

    it("Should not get a list of problems created by a learner with limit but no filter", async() => {
        await ProblemService.archiving(test_problems[0]["slug"]);
        const received_problems = await ProblemService.listProblemsBy(test_user_learner.username, null, 1);
        expect(received_problems).toBeNull;
    });

    it("Should not get a list of problems created by a learner with limit and filter", async() => {
        await ProblemService.archiving(test_problems[0]["slug"]);
        await ProblemService.archiving(test_problems[1]["slug"]); 
        const received_problems = await ProblemService.listProblemsBy(test_user_learner.username, null, 1);
        expect(received_problems).toBeNull;
    });
});

describe("When a user updates a problem's archive property", () => {
    it("When a mentor archives an unarchive problem", async() => {
        const problem = await ProblemService.archiving(test_problems[0]['slug']);
        expect(problem["is_archived"]).toBe(true);
    });

    it("When a mentor archives an already archived problem", async () => {
        await ProblemService.archiving(test_problems[0]["slug"]);
        const problem = await ProblemService.archiving(test_problems[0]["slug"]);
        expect(problem["is_archived"]).toBe(true);
    });

    it("When a mentor unarchives an archived problem", async () => {
        await ProblemService.archiving(test_problems[0]["slug"]);
        const problem = await ProblemService.archiving(test_problems[0]["slug"], false);
        expect(problem["is_archived"]).toBe(false);
    });

    it("When a mentor unarchives an already unarchived problem", async () => {
        const problem = await ProblemService.archiving(test_problems[0]["slug"], false);
        expect(problem["is_archived"]).toBe(false);
    });
});

describe("When a user reschedules a problem", () => {
    it ("When a mentor resechedules an existing problem", async () => {
        let release = new Date();
        let deadline = new Date() + 1;
        const problem = await ProblemService.reschedule({
            "slug": test_problems[0]["slug"],
            "release": release,
            "deadline": deadline
        });

        expect(problem["release"]).toBe(new Date(release).toLocaleString());
        expect(problem["deadline"]).toBe(new Date(deadline).toLocaleString());
    });
    
    it("When a mentor resechedules an non-existing problem", async () => {
        let release = new Date();
        let deadline = new Date() + 1;
        const problem = await ProblemService.reschedule({
            slug: new Problem,
            release: release,
            deadline: deadline,
        });

        expect(problem).toBe(undefined);
    }); 
});

describe("When a user destroys a problem record", () => {
    it("When a user unpublishes an existing problem", async () => {
        await ProblemService.unpublish(test_problems[0]["slug"]);
        const problem =  await ProblemService.inspect(test_problems[0]["slug"]);

        expect(problem).toBeNull();
    });

    it("When a user unpublishes a non-existing problem", async () => {
        const problem = await ProblemService.unpublish(new Problem());
        expect(problem).toBeNull();
    });
}) 