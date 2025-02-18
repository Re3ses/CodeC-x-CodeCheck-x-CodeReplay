const generate_user_learners = (limit = 1) => {
  let users = [];
  for (let i = 1; i <= limit; i++) {
    users.push({
        first_name: "learner",
        last_name: i,
        type: "Learner",
        username: "learner" + i,
        password: "password",
        email: "testuseremail@gmail.com", 
    });
  }
  return users;
};

const generate_user_mentors = (limit = 1) => {
  let users = [];
  for (let i = 1; i <= limit; i++) {
    users.push({
        first_name: "mentor",
        last_name: i,
        type: "Mentor",
        username: "mentor" + i,
        password: "password",
        email: "testuseremail@gmail.com",
      
    });
  }
  return users; 
};

const generate_problems = (limit = 1) => {
  let problems = [];
  for (let i = 1; i <= limit; i++) {
    problems.push({
        name: "Test Problem " + i,
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
                space_complexity: 1,
            },
        ],
        test_cases: [
            {
                input: "1",
                output: "1",
            },
        ],
    });  
  }
  return problems;
}


const generate_code_rooms = (limit = 1) => {
  let coderooms = [];
  for (let i = 1; i <= limit; i++) {
    coderooms.push({
      name: "Test Coderoom " + i,
      description: "This is a test coderoom",
      type: "Competitive",
    });
  }
  return coderooms;
}

module.exports = {
  generate_user_learners,
  generate_user_mentors,
  generate_problems,
  generate_code_rooms
};
