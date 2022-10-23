const express = require("express");
const app = express();

app.use(express.json());

const path = require("path");
const dpPath = path.join(__dirname, "covid19India.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let db = null;

const initializeAndStartServer = async () => {
  try {
    db = await open({
      filename: dpPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("server Running");
    });
  } catch (error) {
    console.log(`error:${error.message}`);
    process.exit(1);
  }
};

initializeAndStartServer();

const convertState = (each) => {
  return {
    stateId: each.state_id,
    stateName: each.state_name,
    population: each.population,
  };
};

const convertDist = (each) => {
  return {
    districtId: each.district_id,
    districtName: each.district_name,
    stateId: each.state_id,
    cases: each.cases,
    cured: each.cured,
    active: each.active,
    deaths: each.deaths,
  };
};

// return all states API1 done

app.get("/states/", async (request, response) => {
  const displayingStates = `SELECT * FROM state ORDER BY state_id ;`;

  const StatesArray = await db.all(displayingStates);
  response.send(StatesArray.map((each) => convertState(each)));
});

// return a state based on id api2 done

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const DisplayState = `select * from state where state_id=${stateId};`;

  const state = await db.get(DisplayState);
  response.send(convertState(state));
});

// add a district api3 done

app.post("/districts/", async (request, response) => {
  const addDist = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = addDist;

  const addDistSql = ` INSERT INTO district
        ( district_name	,state_id	,cases	,cured	,active,deaths)

        values (  "${districtName}" , "${stateId}", "${cases}", "${cured}" , "${active}","${deaths}");
        `;

  const addingDist = await db.run(addDistSql);
  const districtId = addingDist.lastID;
  response.send("District Successfully Added");
});

// return a district based on id api4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const gettingDistSql = `select * from district 
    where district_id=${districtId};`;

  const districtResponse = await db.get(gettingDistSql);
  response.send(convertDist(districtResponse));
});

// delete a district on id api5 done

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteSql = `delete from district
    where district_id=${districtId};`;

  await db.run(deleteSql);
  response.send("District Removed");
});

// update district details api6 done

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const updatedDetails = request.body;

  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = updatedDetails;

  const updatingSql = `update district
  SET
      district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
  WHERE
    district_id = ${districtId};
  `;
  await db.run(updatingSql);
  response.send("District Details Updated");
});

// calculating total  api7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const statsSql = `select
     SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)

      from district
      where state_id=${stateId};`;

  const status = await db.get(statsSql);
  response.send({
    totalCases: status["SUM(cases)"],
    totalCured: status["SUM(cured)"],
    totalActive: status["SUM(active)"],
    totalDeaths: status["SUM(deaths)"],
  });
});

// api8 stateName of district

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const sqlQuery = ` select *
    from state natural join district
    where district_id=${districtId}`;

  const stateName = await db.get(sqlQuery);
  response.send({ stateName: stateName.state_name });
});

module.exports = app;
