import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableContainer,
  TableBody,
  Paper,
  Typography,
} from "@mui/material";

// Render Table Component
export const RenderTable = ({ title, rows }) => {
  if (!rows || rows.length === 0) return null;
  const headers = Object.keys(rows[0]);

  return (
    <TableContainer
      component={Paper}
      style={{ maxHeight: 300, overflowY: "auto", marginTop: 10 }}
    >
      <Typography variant="h6" style={{ padding: "10px" }}>
        {title}: {rows.length} rows
      </Typography>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {headers.map((header) => (
              <TableCell key={header}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              {headers.map((header) => (
                <TableCell key={`${index}-${header}`}>
                  {row[header]?.toString() || "NULL"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
