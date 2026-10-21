export const GITHUB_WORKSHOP = {
  id: "f367e520-8a9d-4228-9268-45747c423990",
  title: "SASE X KH | Intro to Git and Github Etiquette",
  start: "2026-10-20T21:00:00.000Z",
  end: "2026-10-20T22:00:00.000Z",
  points: 30,
  location: "HEC 101",
} as const;

// The supplied graduation terms and majors are retained as source evidence;
// they do not overwrite a member's own profile responses.
export const GITHUB_WORKSHOP_ROSTER = [
  ["Abhinav Vargheese", "Spring 2029", "Computer Science"],
  ["Altynai Arzibaeva", "Spring 2029", "Computer Science"],
  ["Anthony Banuelos", "Summer 2028", "Computer Science"],
  ["Anthony Green", "Spring 2029", "Computer Engineering"],
  ["Caden Roell", "Spring 2028", "Computer Engineering"],
  ["Daniel Kantor", "Spring 2028", "Computer Science"],
  ["Daniel Rangosch", "Summer 2027", "Computer Science"],
  ["Ethan Lamb", "Spring 2028", "Computer Science"],
  ["Faaris Rapati", "Spring 2030", "Computer Science"],
  ["Jason Nguyen", "Spring 2028", "Computer Science"],
  ["Jimmy Bui", "Fall 2026", "Information Technology"],
  ["Jonathan Casey", "Spring 2029", "Computer Science"],
  ["Jose Yepez", "Spring 2029", "Computer Science"],
  ["José Costas", "Summer 2027", "Information Technology"],
  ["Kayla Tran", "Spring 2030", "Computer Science"],
  ["Kevin Li", "Fall 2029", "Computer Science"],
  ["Kirk Lorenzo Canas", "Spring 2030", "Computer Science"],
  ["Marc Alexis", "Fall 2028", "Computer Science"],
  ["Natalie Reese", "Spring 2028", "Computer Science"],
  ["Quynh Do", "Spring 2029", "Computer Engineering"],
  ["Rachel Diaz", "Spring 2029", "Computer Science"],
  ["Scott Chairi", "Spring 2030", "Computer Science"],
  ["Tan Nguyen", "Spring 2028", "Computer Engineering"],
  ["Xiangtao Wu", "Spring 2028", "Computer Science"],
  ["Youssef Khairy", "Spring 2029", "Computer Engineering"],
] as const;

// The officer explicitly requested credit for BOTH Kevin Li accounts. These
// fixed account IDs are the sole exception to the unique-name matching rule.
const KEVIN_LI_ACCOUNTS = ["61b9652f-4192-41bb-8d05-cafea3e4d55b", "4fd99dcc-95b2-4041-ad88-b55793c2f9e9"];
export const WORKSHOP_CREDIT_ENTRIES = GITHUB_WORKSHOP_ROSTER.flatMap(([name, graduationTerm, major]) =>
  (name === "Kevin Li" ? KEVIN_LI_ACCOUNTS : [null]).map(targetProfileId => ({ name, graduationTerm, major, targetProfileId })),
);
