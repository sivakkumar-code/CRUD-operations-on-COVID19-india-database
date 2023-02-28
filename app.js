const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started listening...");
    });
  } catch (err) {
    console.log(`DB error ${err.message}`);
    process.exit(1);
  }
};
initializeDBandServer();

// get all states in the state table
app.get("/states/", async (req, res) => {
  const sqlQuery = `
        SELECT *
        FROM state;
    `;
  const dbResponse = await db.all(sqlQuery);
  const finalResponse = dbResponse.map((item) => {
    return {
      stateId: item.state_id,
      stateName: item.state_name,
      population: item.population,
    };
  });
  res.send(finalResponse);
});

// get state based on the state ID
app.get("/states/:stateId", async (req, res) => {
  const { stateId } = req.params;
  const sqlQuery = `
        SELECT *
        FROM state
        WHERE state_id = ${stateId};
    `;
  const dbResponse = await db.get(sqlQuery);
  const finalResponse = {
    stateId: dbResponse.state_id,
    stateName: dbResponse.state_name,
    population: dbResponse.population,
  };

  res.send(finalResponse);
});

// Create a new district in the district table
app.post("/districts/", async (req, res) => {
  const districtDetails = req.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const sqlQuery = `
        INSERT INTO
            district (district_name, state_id, cases, cured, active, deaths)
        VALUES(
            '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
        );
    `;
  const dbResponse = await db.run(sqlQuery);
  res.send("District Successfully Added");
});

// get district based on the district ID
app.get("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const sqlQuery = `
        SELECT *
        FROM district
        WHERE district_id = ${districtId};
    `;
  const dbResponse = await db.get(sqlQuery);
  const finalResponse = {
    districtId: dbResponse.district_id,
    districtName: dbResponse.district_name,
    stateId: dbResponse.state_id,
    cases: dbResponse.cases,
    cured: dbResponse.cured,
    active: dbResponse.active,
    deaths: dbResponse.deaths,
  };
  res.send(finalResponse);
});

// Deletes a district from the district table based on the district ID
app.delete("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const sqlQuery = `
        DELETE
        FROM district
        WHERE district_id = ${districtId};
    `;
  await db.get(sqlQuery);
  res.send("District Removed");
});

// Updates the details of a specific district based on the district ID
app.put("/districts/:districtId/", async (req, res) => {
  const districtDetails = req.body;
  const { districtId } = req.params;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const sqlQuery = `
        UPDATE
            district
        SET
            district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
        WHERE district_id = ${districtId};
    `;
  const dbResponse = await db.run(sqlQuery);
  res.send("District Details Updated");
});

// Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (req, res) => {
  const { stateId } = req.params;
  console.log(req.params);
  const sqlQuery = `
        SELECT sum(cases) AS totalCases, sum(cured) AS totalCured, sum(active) AS totalActive, sum(deaths) AS totalDeaths
        FROM state JOIN district ON state.state_id = district.state_id
        WHERE state.state_id = ${stateId}
        GROUP BY state.state_id;;
    `;
  const dbResponse = await db.get(sqlQuery);
  console.log(dbResponse);

  res.send(dbResponse);
});

// Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (req, res) => {
  const { districtId } = req.params;
  const sqlQuery = `
        SELECT state.state_name
        FROM district JOIN state ON district.state_id = state.state_id
        WHERE district_id = ${districtId};
    `;
  const dbResponse = await db.get(sqlQuery);
  const finalResponse = {
    stateName: dbResponse.state_name,
  };
  res.send(finalResponse);
});

module.exports = app;

// SELECT sum(cases) AS totalCases, sum(cured) AS totalCured, sum(active) AS totalActive, sum(deaths) AS totalDeaths
//         FROM state JOIN district ON state.state_id = district.state_id
//         WHERE state.state_id = ${stateId}
//         GROUP BY state.state_id;
