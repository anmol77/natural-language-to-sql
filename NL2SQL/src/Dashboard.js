import React, { useState } from "react";
import {
  Grid,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  Stack,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CalculateIcon from "@mui/icons-material/Calculate";
import { RenderTable } from "./RenderTable";
import MonacoEditor from "@monaco-editor/react";

export default function Dashboard({ schemaFile, dataFile, model, db }) {
  const [nlQuery, setNlQuery] = useState("");
  const [predictedSql, setPredictedSql] = useState("");
  const [expectedSql, setExpectedSql] = useState("");
  const [predictedResults, setPredictedResults] = useState([]);
  const [expectedResults, setExpectedResults] = useState([]);
  const [bleuScore, setBleuScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const formatInputText = (dbId, tables, question) => {
    let formattedText = `<db_id>${dbId}`;

    tables.forEach(({ tableName, columns }) => {
      formattedText += `<table>${tableName}<col>`;
      const columnDescriptions = columns.map(
        ({ name, isPrimaryKey, foreignKey }) => {
          let colText = isPrimaryKey ? `<primary_key>${name}` : name;
          if (foreignKey) {
            colText += `<parent_table>${foreignKey.parentTable}<referred_key>${foreignKey.parentColumn}`;
          }
          return colText;
        }
      );
      formattedText += columnDescriptions.join("<sep>");
    });

    formattedText += `<question>${question}`;
    return formattedText;
  };

  const extractDatabaseSchema = (db) => {
    const tables = [];

    // Get all tables in the database
    const tableResults = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table';"
    );

    if (tableResults.length === 0) {
      return tables;
    }

    const tableNames = tableResults[0].values.map((row) => row[0]);

    // Extract details for each table
    tableNames.forEach((tableName) => {
      const columns = [];

      // Extract column details
      const columnResults =
        db.exec(`PRAGMA table_info(${tableName});`)[0]?.values || [];

      // Extract foreign key info
      const foreignKeyResults =
        db.exec(`PRAGMA foreign_key_list(${tableName});`)[0]?.values || [];

      columnResults.forEach((col) => {
        const [cid, name, , , , isPrimaryKey] = col;

        // Check for foreign key references
        const foreignKey = foreignKeyResults.find((fk) => fk[3] === name);

        columns.push({
          name,
          isPrimaryKey: isPrimaryKey === 1,
          foreignKey: foreignKey
            ? {
                parentTable: foreignKey[2],
                parentColumn: foreignKey[4],
              }
            : null,
        });
      });

      tables.push({ tableName, columns });
    });

    return tables;
  };

  const handleSendQuery = async () => {
    if (!nlQuery || !model || !db) {
      alert("Please enter a query, select a model, and upload a database.");
      return;
    }

    setLoading(true); // Start loading spinner

    const tables = extractDatabaseSchema(db);
    const dbId = dataFile.name.replace(".sqlite", "");
    const formattedQuery = formatInputText(dbId, tables, nlQuery);

    try {
      const response = await fetch(
        `https://tc7j4z5zyb.execute-api.us-east-1.amazonaws.com/${model}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input_text: formattedQuery }),
        }
      );
      const result = await response.json();
      setPredictedSql(result.output_text);
    } catch (error) {
      alert("Error fetching data: " + error.message);
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };

  const handleExecuteSQL = (sqlType) => {
    const sqlQuery = sqlType === "predicted" ? predictedSql : expectedSql;

    if (!db || !sqlQuery.trim()) {
      alert(`Database not initialized or ${sqlType} SQL query is empty.`);
      return;
    }

    try {
      const results = db.exec(sqlQuery); // Execute query
      if (results.length === 0) {
        alert("No results found. Please check your query.");
      } else {
        console.log("Query results:", results);
      }
      const formattedResults = results.length
        ? results[0].values.map((row) =>
            Object.fromEntries(
              results[0].columns.map((col, i) => [col, row[i]])
            )
          )
        : [];

      if (sqlType === "predicted") {
        setPredictedResults(formattedResults);
      } else {
        setExpectedResults(formattedResults);
      }
    } catch (error) {
      alert(`Error executing ${sqlType} SQL: ${error.message}`);
    }
  };

  const calculateBleuScore = async () => {
    if (!predictedSql || !expectedSql) {
      alert("Both Predicted and Expected SQL queries must be filled out.");
      return;
    }

    try {
      const response = await fetch(
        `https://tc7j4z5zyb.execute-api.us-east-1.amazonaws.com/bleu`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference: expectedSql,
            candidate: predictedSql,
          }),
        }
      );

      const result = await response.json();

      if (result?.bleu_score !== undefined) {
        setBleuScore(result.bleu_score.toFixed(8));
      } else {
        alert("BLEU score not returned in API response.");
      }
    } catch (error) {
      console.error("Error calculating BLEU score:", error);
      alert("Error calculating BLEU score: " + error.message);
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setShowToast(true);
  };

  return (
    <>
      <Grid container spacing={2} style={{ padding: 20 }}>
        <Grid item xs={12}>
          <TextField
            label="Natural Language Query"
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            fullWidth
            InputProps={{
              endAdornment: (
                <IconButton onClick={handleSendQuery} disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
              ),
            }}
          />
        </Grid>

        <Grid item xs={6}>
          <Typography variant="body1">
            <Stack direction="row" spacing={1} alignItems="center">
              Predicted SQL Output
              <IconButton onClick={() => handleCopyToClipboard(predictedSql)}>
                <ContentCopyIcon />
              </IconButton>
              <IconButton
                onClick={() => handleExecuteSQL("predicted")}
                disabled={!predictedSql.trim()}
              >
                <SendIcon />
              </IconButton>
            </Stack>
          </Typography>

          <MonacoEditor
            height="150px"
            language="sql"
            theme="vs-dark"
            value={predictedSql}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              wordWrap: "on", // Enables wrapping
              wrappingIndent: "indent", // Keeps indentation when wrapping
              readOnly: true,
            }}
          />
          <RenderTable title="Predicted Results" rows={predictedResults} />
        </Grid>

        <Grid item xs={6}>
          <Typography variant="body1">
            <Stack direction="row" spacing={1} alignItems="center">
              Expected SQL Output
              <IconButton onClick={calculateBleuScore}>
                <CalculateIcon />
              </IconButton>
              <IconButton
                onClick={() => handleExecuteSQL("expected")}
                disabled={!expectedSql.trim()}
              >
                <SendIcon />
              </IconButton>
            </Stack>
          </Typography>

          <MonacoEditor
            height="150px"
            language="sql"
            theme="vs-dark"
            value={expectedSql}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              wordWrap: "on", // Enables wrapping
              wrappingIndent: "indent", // Keeps indentation when wrapping
            }}
            onChange={(value) => setExpectedSql(value)}
          />
          <RenderTable title="Expected Results" rows={expectedResults} />
        </Grid>

        {
          <Grid item xs={12} style={{ marginTop: 20 }}>
            <Typography variant="h6">BLEU Score: {bleuScore}</Typography>
          </Grid>
        }
      </Grid>

      <Snackbar
        open={showToast}
        autoHideDuration={3000}
        onClose={() => setShowToast(false)}
      >
        <Alert severity="success">Copied to clipboard!</Alert>
      </Snackbar>
    </>
  );
}