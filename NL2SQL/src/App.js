import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  TextField,
  MenuItem,
  Switch,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import initSqlJs from "sql.js";
import Dashboard from "./Dashboard.js";
import "./styles.css";

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dataFile, setDataFile] = useState(null);
  const [model, setModel] = useState("base");
  const [db, setDb] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setDataFile(file);
  };

  const createDatabase = async () => {
    if (!(dataFile instanceof File)) {
      alert("Please upload a valid SQLite database file.");
      return;
    }

    try {
      const SQL = await initSqlJs({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/sql.js@1.6.2/dist/${file}`,
      });

      const dataBuffer = await dataFile.arrayBuffer();
      const dbInstance = new SQL.Database(new Uint8Array(dataBuffer));

      dbInstance.run("PRAGMA foreign_keys = ON;");

      // Debug Info
      console.log(
        "Tables in DB:",
        dbInstance.exec("SELECT name FROM sqlite_master WHERE type='table';")
      );

      setDb(dbInstance); // Set the database
      window.db = dbInstance; // Expose globally for console testing

      alert("Database created successfully!");
    } catch (error) {
      alert("Error creating database: " + error.message);
    }
  };

  return (
    <div className="App">
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6">Natural Language to SQL</Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer with inputs */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <List style={{ width: 500, padding: 20 }}>
          <Typography variant="h6">Inputs</Typography>

          {/* Model Selection */}
          <ListItem>
            <TextField
              select
              label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              fullWidth
            >
              <MenuItem value="base">Base</MenuItem>
              <MenuItem value="finetuned">Fine-tuned</MenuItem>
            </TextField>
          </ListItem>

          <ListItem>
            <TextField
              type="file"
              label="SQLite File"
              onChange={handleFileUpload}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </ListItem>

          <ListItem>
            <Button variant="contained" onClick={createDatabase} fullWidth>
              Create Database
            </Button>
          </ListItem>
        </List>
      </Drawer>

      {/* Main Content Area */}
      <div style={{ paddingTop: 64 }} className="app-content">
        <Dashboard dataFile={dataFile} model={model} db={db} />
      </div>
    </div>
  );
}
