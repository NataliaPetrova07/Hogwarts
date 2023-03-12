"use strict";

window.addEventListener("DOMContentLoaded", start);

const url = "https://petlatkea.dk/2021/hogwarts/students.json";
const url2 = "https://petlatkea.dk/2021/hogwarts/families.json";

const Student = {
  firstName: "-unknown-",
  middleName: "-unknown-",
  lastName: "-unknown-",
  house: "-unknown-",
  portrait: "",
  bloodStatus: "-unknown-",
  prefect: false,
  expelled: false,
  squad: false,
};

const settings = {
  filter: "all",
  sortBy: "name",
  sortDir: "asc",
};

const myself = {
  firstName: "Natália",
  middleName: "N/A",
  lastName: "Petrová",
  nickName: "Lil P",
  house: "Hufflepuff",
  gender: "girl",
  portrait: "/images/natalia_p.png",
  bloodStatus: "muggle",
  prefect: false,
  expelled: false,
  squad: false,
};

let allStudents = [];
const expelledStudents = [];
let nonExpelledStudents = [];
let bloodStatusJSON = {};
let isHacking = false;

async function start() {
  console.log("ready");
  registerButtons();
  await loadBloodStatusJSON();
  await loadStudentsJSON();
}

function registerButtons() {
  document.querySelectorAll("[data-action='filter']").forEach((button) => button.addEventListener("click", selectFilter));
  document.querySelectorAll("[data-action='sort']").forEach((button) => button.addEventListener("click", selectSort));
  document.querySelector("#site_search").addEventListener("keyup", searchFieldInput);
}

// SEARCH FIELD

function searchFieldInput() {
  const searchValue = document.querySelector("#site_search").value;
  console.log(searchValue);
  if (searchValue === "hack") {
    hackTheSystem();
  } else if (searchValue !== "") {
    let searchValueString = capitalize(searchValue);
    searchFilter(searchValueString, searchValue);
  } else {
    displayList(allStudents);
  }
}

function searchFilter(searchValueString, searchValue) {
  let searchArray = [];
  allStudents.forEach(checking);
  function checking(student) {
    console.log(student.firstName);
    if (student.firstName.includes(searchValueString)) {
      searchArray.push(student);
    }
    if (student.lastName !== undefined && student.lastName.includes(searchValueString) && student.lastName.includes(searchValueString) !== student.firstName.includes(searchValueString)) {
      searchArray.push(student);
    }
    if (student.firstName.includes(searchValue)) {
      searchArray.push(student);
    }
    if (student.lastName !== undefined && student.lastName.includes(searchValue) && student.lastName.includes(searchValue) !== student.firstName.includes(searchValue)) {
      searchArray.push(student);
    }
  }
  displayList(searchArray);
  showAbout(searchArray);
}

// ABOUT
function showAbout(list) {
  document.querySelector("#current_students_nr").textContent = list.length;
  document.querySelector("#gryffindor_students_nr").textContent = list.filter(isGryffindor).length;
  document.querySelector("#slytherin_students_nr").textContent = list.filter(isSlytherin).length;
  document.querySelector("#ravenclaw_students_nr").textContent = list.filter(isRavenclaw).length;
  document.querySelector("#hufflepuff_students_nr").textContent = list.filter(isHufflepuff).length;
  document.querySelector("#expelled_students_nr").textContent = expelledStudents.length;
}

// EXPEL STUDENT
function expelStudent(selectedStudent, ev) {
  console.log(ev);
  console.log("selectedStudent: ", selectedStudent);
  selectedStudent.expelled = true;
  ev.target.parentElement.classList.add("fade");
  expelledStudents.push(selectedStudent);
  nonExpelledStudents = allStudents.filter((student) => student.expelled === false);
  console.log("expelledStudents: ", expelledStudents.length);
  console.log("nonExpelledStudents: ", nonExpelledStudents.length);
  setTimeout(() => {
    displayList(nonExpelledStudents);
  }, 1500);

  showAbout(nonExpelledStudents);
}

// LOAD JSON
async function loadBloodStatusJSON() {
  const response = await fetch(url2);
  let jsonData = await response.json();

  bloodStatusJSON = jsonData;
}
async function loadStudentsJSON() {
  const response = await fetch(url);
  let jsonData = await response.json();

  getNameParts(jsonData);
}

// CLEAN DATA
function getNameParts(jsonData) {
  jsonData.forEach((jsonObject) => {
    // Create new object
    const student = Object.create(Student);
    // Extract data from json object
    const fullname = jsonObject.fullname.trim();
    const words = jsonObject.fullname.trim().split(" ");
    let house = jsonObject.house;
    const gender = jsonObject.gender;
    const firstSpace = fullname.indexOf(" ");
    const secondSpace = fullname.indexOf(" ", firstSpace + 1);
    const lastSpace = fullname.lastIndexOf(" ");
    const firstticks = fullname.indexOf(`"`);
    const lastticks = fullname.lastIndexOf(`"`);
    let bloodStatus = jsonObject.bloodStatus;

    let nickname = fullname.substring(firstticks + 1, lastticks);
    let firstName = "";
    let middleName = "";
    let lastName = "";

    if (words.length == 2) {
      firstName = words[0];
      middleName = undefined;
      lastName = words[1];
    } else {
      firstName = words[0];
      middleName = words[1];
      lastName = words[2];
    }
    // console.log(firstName, middleName, lastName);

    house = jsonObject.house.trim();
    firstName = firstName.trim();
    house = capitalize(house);

    if (middleName !== undefined && middleName.indexOf(`"`) >= 0) {
      middleName = undefined;
    }
    if (middleName !== undefined) {
      middleName = capitalize(middleName);
    }
    if (lastName !== undefined) {
      lastName = capitalize(lastName);
      if (lastName.indexOf("-") >= 0) {
        let lastNames = lastName.split("-");
        let secondLastName = capitalize(lastNames[1]);
        lastName = lastNames[0] + "-" + secondLastName;
      }
    }

    if (nickname === "") {
      nickname = undefined;
    }

    firstName = capitalize(firstName);

    // Put cleaned data into newly created object
    student.firstName = firstName;
    student.middleName = middleName;
    student.lastName = lastName;
    student.nickname = nickname;
    student.house = house;
    student.bloodStatus = getBloodStatus(student);

    if (lastName !== undefined) {
      student.portrait = "images/" + student.lastName.toLowerCase() + "_" + student.firstName[0].toLowerCase() + ".png";
      if (jsonObject.fullname.includes("-")) {
        let twoNames = lastName.split("-");
        let secondName = twoNames[1].toLowerCase();
        student.portrait = "images/" + secondName + "_" + student.firstName[0].toLowerCase() + ".png";
      }
    }

    // Add the object to the global array
    allStudents.push(student);

    return student;
  });

  console.table(allStudents);
  displayList(allStudents);
  showAbout(allStudents);
}

// BLOOD STATUS CHECK
function getBloodStatus(student) {
  if (bloodStatusJSON.pure.indexOf(student.lastName) > -1) {
    return "pure";
  } else if (bloodStatusJSON.half.indexOf(student.lastName) > -1) {
    return "half-blood";
  } else {
    return "muggle";
  }
}

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}

// FILTERING

function selectFilter(event) {
  const filter = event.target.dataset.filter;
  console.log(`User selected ${filter}`);
  // filterList(filter);
  setFilter(filter);
}

function setFilter(filter) {
  settings.filterBy = filter;
  console.log("settings.filterBy:", settings.filterBy);
  buildList();
}

function filterList(filteredList) {
  //   let filteredList = allStudents;
  if (settings.filterBy === "slytherin") {
    filteredList = allStudents.filter(isSlytherin);
  } else if (settings.filterBy === "hufflepuff") {
    filteredList = allStudents.filter(isHufflepuff);
  } else if (settings.filterBy === "gryffindor") {
    filteredList = allStudents.filter(isGryffindor);
  } else if (settings.filterBy === "ravenclaw") {
    filteredList = allStudents.filter(isRavenclaw);
  } else if (settings.filterBy === "prefects") {
    filteredList = allStudents.filter(isPrefect);
  } else if (settings.filterBy === "squad") {
    filteredList = allStudents.filter(isSquad);
  } else if (settings.filterBy === "expelled") {
    filteredList = allStudents.filter(isExpelled);
    document.querySelector("h1").textContent = "Expelled students";
  } else if (settings.filterBy === "muggles") {
    filteredList = allStudents.filter(isMuggle);
  } else if (settings.filterBy === "pureblood") {
    filteredList = allStudents.filter(isPure);
  } else if (settings.filterBy === "halfblood") {
    filteredList = allStudents.filter(isHalf);
  } else if (settings.filterBy === "all") {
    filteredList = allStudents.filter(filterAll);
  }
  // console.log("allStudents:", allStudents);
  // console.log("filtered list:", filteredList);
  return filteredList;
}

function isSlytherin(student) {
  return student.house === "Slytherin";
}

function isHufflepuff(student) {
  return student.house === "Hufflepuff";
}

function isGryffindor(student) {
  return student.house === "Gryffindor";
}

function isRavenclaw(student) {
  return student.house === "Ravenclaw";
}

function isPrefect(student) {
  return student.prefect === true;
}

function isExpelled(student) {
  return student.expelled === true;
}

function isSquad(student) {
  return student.squad === true;
}

function isMuggle(student) {
  return student.bloodStatus === "muggle";
}

function isHalf(student) {
  return student.bloodStatus === "half-blood";
}

function isPure(student) {
  return student.bloodStatus === "pure";
}

function filterAll(student) {
  return true;
}

// SORTING

function selectSort(event) {
  const sortBy = event.target.dataset.sort;
  const sortDir = event.target.dataset.sortDirection;
  console.log("sortBy: ", sortBy);
  console.log("sortDir: ", sortDir);

  // find "old" sortby element, and remove .sortBy
  const oldElement = document.querySelector(`[data-sort='${sortBy}']`);
  oldElement.classList.remove("sortby");
  console.log("oldElement: ", oldElement);

  // indicate active sort
  event.target.classList.add("sortby");

  // toggle the direction!
  if (sortDir === "asc") {
    event.target.dataset.sortDirection = "desc";
  } else {
    event.target.dataset.sortDirection = "asc";
  }
  console.log(`User selected ${sortBy} - ${sortDir}`);
  setSort(sortBy, sortDir);
}

function setSort(sortBy, sortDir) {
  settings.sortBy = sortBy;
  settings.sortDir = sortDir;
  buildList();
}

function sortList(sortedList) {
  let direction = 1;
  if (settings.sortDir === "desc") {
    direction = -1;
  } else {
    settings.direction = 1;
  }

  sortedList = sortedList.sort(sortByProperty);

  function sortByProperty(studentA, studentB) {
    if (studentA[settings.sortBy] < studentB[settings.sortBy]) {
      return -1 * direction;
    } else {
      return 1 * direction;
    }
  }

  return sortedList;
}

function buildList() {
  const currentList = filterList(allStudents);
  const sortedList = sortList(currentList);
  showAbout(sortedList);
  displayList(sortedList);
}

function displayList(currentList) {
  // clear the list
  document.querySelectorAll("tr").forEach((element) => {
    element.remove();
  });
  // build a new list
  currentList.forEach(displayStudent);
  closeModal();
}

function displayStudent(student) {
  // create clone
  const clone = document.querySelector("template#student").content.cloneNode(true);

  // set clone data
  clone.querySelector("[data-field=firstName]").textContent = student.firstName;
  clone.querySelector("[data-field=lastName]").textContent = student.lastName;
  clone.querySelector("[data-field=house]").textContent = student.house;

  clone.querySelector("[data-field=student_info]").addEventListener("click", () => openModal(student));
  clone.querySelector(".expelbtn").addEventListener("click", (ev) => expelStudent(student, ev));
  clone.querySelector("[data-field=prefect]").addEventListener("click", () => clickPrefect(student));
  clone.querySelector("[data-field=squad]").addEventListener("click", () => clickSquad(student));

  if (student.expelled === true) {
    clone.querySelector(".expelbtn").classList.add("hidden");
  }

  if (student.squad === false) {
    clone.querySelector(".squad_id").setAttribute("fill", "#c0c0c0");
  } else {
    clone.querySelector(".squad_id").setAttribute("fill", "#000000");
  }

  if (student.prefect === false) {
    clone.querySelector(".prefect_icon").setAttribute("fill", "#c0c0c0");
  } else {
    clone.querySelector(".prefect_icon").setAttribute("fill", "#000000");
  }

  // append clone to list
  document.querySelector("#list").appendChild(clone);
}

// MODAL / POPUP
function closeModal() {
  document.querySelector("#popup").classList.add("hidden");
}

function openModal(student) {
  document.querySelector("#popup").classList.remove("hidden");
  document.querySelector("img.student_img").src = student.portrait;
  document.querySelector("p.firstName").textContent = `First name: ${student.firstName}`;
  document.querySelector("p.lastName").textContent = `Last name: ${student.lastName}`;
  document.querySelector("p.bloodStatus").textContent = `Blood Status: ${student.bloodStatus}`;
  if (student.middleName === undefined) {
    document.querySelector("p.middleName").textContent = `Middle name: N/A`;
  } else {
    document.querySelector("p.middleName").textContent = `Middle name: ${student.middleName}`;
  }
  if (student.nickname === undefined) {
    document.querySelector("p.nickName").textContent = `Nickname: N/A`;
  } else {
    document.querySelector("p.nickName").textContent = `Nickname: ${student.nickName}`;
  }
  if (student.prefect) {
    document.querySelector("p.prefect").textContent = `Prefect: yes`;
  } else {
    document.querySelector("p.prefect").textContent = `Prefect: no`;
  }
  if (student.squad) {
    document.querySelector("p.squad").textContent = `Member of inquisitorial squad: yes`;
  } else {
    document.querySelector("p.squad").textContent = `Member of inquisitorial squad: no`;
  }
  if (student.expelled) {
    document.querySelector("p.expelled").textContent = `Expelled: yes`;
  } else {
    document.querySelector("p.expelled").textContent = `Expelled: no`;
  }
  document.querySelector("p.house").textContent = `House: ${student.house}`;
  document.querySelector("div.close").addEventListener("click", closeModal);

  let selectedHouse = student.house;

  if (selectedHouse) {
    document.querySelector("#popup_section").classList.value = "";
    document.querySelector("#popup_section").classList.add(student.house);
    document.querySelector(".house_img").src = "images/" + selectedHouse + ".webp";
  }
}

// MAKE PREFECT
function clickPrefect(student) {
  if (student.prefect === true) {
    student.prefect = false;
    console.log("user clicked remove prefect");
  } else {
    makePrefect(student);
    console.log("user clicked make prefect");
  }
  buildList();
}

function makePrefect(student) {
  console.log("making a prefect");
  let sameHouseStudents = allStudents.filter((houseStudent) => {
    return student.house === houseStudent.house;
  });
  let prefectsOfSameHouse = sameHouseStudents.filter((sameHouseStudent) => {
    return sameHouseStudent.prefect;
  });
  if (prefectsOfSameHouse.length >= 2) {
    alert("There can only be 2 prefects in the same house");
  } else if (student.expelled === true) {
    alert("Expelled students can't be made prefects");
  } else {
    student.prefect = true;
  }
}

// MAKE MEMBER OF INQUISITORIAL SQUAD
function clickSquad(student) {
  console.log("user clicked squad");
  if (student.squad === true) {
    student.squad = false;
  } else {
    makeMember(student);
  }
  buildList();
}

function makeMember(student) {
  if (student.house === "Slytherin" && student.bloodStatus === "pure") {
    student.squad = true;
  } else if (student.expelled === true) {
    alert("Expelled students can't be made members of the Inquisitorial squad");
  } else {
    alert("You can't make a muggle or non-Slytherin a member of the Inquisitorial squad");
  }
}

// HACKING
function hackTheSystem() {
  if (isHacking) {
    return;
  } else {
    isHacking = true;
    allStudents.push(myself);
    console.error("✨ ლ(ಠ益ಠ)ლ ✨");
    buildList();
    randomBloodStatus();
    cantExpel();
    temporaryInquisitorial();
    document.querySelectorAll("td").forEach((element) => {
      element.classList.add("blinking");
    });
    document.querySelector("h1").classList.add("blinking");
  }
}

function cantExpel() {
  var fnChanger = function (student) {
    console.log(student);

    return function (student) {
      if (student.firstName === "Natália") {
        alert("you have no power here");
      } else {
        student.expelled = true;
        expelledStudents.push(student);
        nonExpelledStudents = allStudents.filter((student) => student.expelled === false);
        console.log("expelledStudents: ", expelledStudents.length);
        console.log("nonExpelledStudents: ", nonExpelledStudents.length);
        displayList(nonExpelledStudents);
        showAbout(nonExpelledStudents);
      }
    };
  };
  expelStudent = fnChanger();
}

function randomBloodStatus() {
  if (isHacking) {
    allStudents = allStudents.map(function (student) {
      const bloodStatusTypes = ["pure", "half-blood", "muggle"];
      student.bloodStatus = bloodStatusTypes[Math.floor(Math.random() * 3)];
      return student;
    });
  }
}

function temporaryInquisitorial() {
  var fnChanger = function (student) {
    return function (student) {
      if (student.house === "Slytherin" && student.bloodStatus === "pure") {
        function makingTemporaryInquisitorial() {
          student.squad = true;
          console.log("added a squad member");
          buildList();
          setTimeout(() => {
            student.squad = false;
            alert("the member will be removed");
            console.log("removed a squad member");
            buildList();
          }, 1000);
        }
        makingTemporaryInquisitorial();
      } else if (student.expelled === true) {
        alert("Expelled students can't be made members of the Inquisitorial squad");
      } else {
        alert("You can't make a muggle or non-Slytherin a member of the Inquisitorial squad");
      }
    };
  };
  makeMember = fnChanger();
}
