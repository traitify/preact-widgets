import toQuery from "../to-query";

const defaultFields = [
  "allottedTime",
  "completed",
  "id",
  "learningDisability",
  "localeKey",
  "name",
  "percentileScore",
  "rawScore",
  "specialAllottedTime",
  "surveyId",
  "surveyKey",
  {
    questions: [
      "id",
      {
        answer: ["answerId", "skipped", "timeTaken"],
        questionImage: ["id", "url"],
        responses: ["id", {image: ["id", "url"]}]
      }
    ]
  }
];

export function create({fields, params}) {
  return {
    query: `
      mutation($localeKey: String, $surveyId: String!) {
        createCognitiveTest(localeKey: $localeKey, surveyId: $surveyId) {
          ${toQuery(fields || defaultFields)}
        }
      }
    `,
    variables: params
  };
}

export function get({fields, params}) {
  return {
    query: `
      query cognitiveTest($localeKey: String, $testId: String!) {
        cognitiveTest(localeKey: $localeKey, testId: $testId) {
          ${toQuery(fields || defaultFields)}
        }
      }
    `,
    variables: params
  };
}

export function surveys(options) {
  const fields = options && options.fields;

  return {
    query: `
      query {
        cognitiveSurveys {
          ${toQuery(fields || {edges: {node: ["id", "key", "name"]}})}
        }
      }
    `
  };
}

export function update({fields, params}) {
  return {
    query: `
      mutation(
        $answers: [QuestionAnswer]!,
        $learningDisability: Boolean,
        $overallTimeTaken: Int!,
        $testId: String!
      ) {
        completeCognitiveTest(
          answers: $answers,
          learningDisability: $learningDisability,
          overallTimeTaken: $overallTimeTaken,
          testId: $testId
        ) {
          ${toQuery(fields || ["message", "success"])}
        }
      }
    `,
    variables: params
  };
}
