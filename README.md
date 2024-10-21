# API Challenges Test Suite

This project contains a suite of automated tests for the API endpoints of [https://apichallenges.herokuapp.com/](https://apichallenges.herokuapp.com/). The tests are written in JavaScript using the Playwright framework.

## Project Structure

- `tests/apiChallenges.test.js`: Contains the API tests for various endpoints.
- `README.md`: Project documentation.


## Installation
To get started with the project, follow the steps below:

1. Clone the repository: `git clone <repository-url>`
2. Navigate to the project directory: `cd <project-directory>`
3. Install the dependencies: `npm install`

## Running the Tests

To run the tests, use the following command:
```sh
npm run api
```

## Test Report

After running the tests, a test report will be generated in the `.allure-result` directory. To view the report, use the following command:
```sh
npm run allureReport
```

Example test report:

![Test Report](picture/allure-report.png)

Example of displaying results on a website:

![Website](picture/API-Challenges-Improve-your-API-Skills.png)