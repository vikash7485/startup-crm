import { Parser } from "json2csv";
import * as xlsx from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Lead from "../models/Lead.js";
import Deal from "../models/Deal.js";

// GET /api/export/:entity/:format
export const exportData = async (req, res) => {
  try {
    const { entity, format } = req.params;
    
    if (!["leads", "deals"].includes(entity)) {
      return res.status(400).json({ success: false, error: "Invalid entity" });
    }
    if (!["csv", "excel", "pdf"].includes(format)) {
      return res.status(400).json({ success: false, error: "Invalid format" });
    }
    
    // Fetch Data mapping RBAC
    let data = [];
    const query = {};
    if (req.user.role !== "admin") {
      query.user_id = req.user.id;
    }

    if (entity === "leads") {
      query.deleted_at = null;
      data = await Lead.find(query).sort({ created_at: -1 }).lean();
    } else {
      data = await Deal.find(query).populate("lead_id", "name").sort({ created_at: -1 }).lean();
    }

    if (data.length === 0) {
      return res.status(404).json({ success: false, error: "No data found for export" });
    }

    // Clean data for export
    const exportData = data.map(item => {
      const base = {
        ID: item._id.toString(),
        CreatedAt: new Date(item.created_at).toLocaleDateString()
      };
      if (entity === "leads") {
        return { ...base, Name: item.name, Email: item.email, Phone: item.phone, Company: item.company, Status: item.status, Source: item.source };
      } else {
        return { ...base, Title: item.title, Lead: item.lead_id?.name || "Unknown", Value: item.value, Status: item.status, "Win Prob": `${item.probability}%` };
      }
    });

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `${entity}-${timestamp}`;

    if (format === "csv") {
      const parser = new Parser();
      const csv = parser.parse(exportData);
      res.header("Content-Type", "text/csv");
      res.attachment(`${filename}.csv`);
      return res.send(csv);
    } 
    
    if (format === "excel") {
      const worksheet = xlsx.utils.json_to_sheet(exportData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Data");
      const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.attachment(`${filename}.xlsx`);
      return res.send(buffer);
    }
    
    if (format === "pdf") {
      const doc = new jsPDF();
      doc.text(`Exported ${entity.toUpperCase()}`, 14, 15);
      
      const headers = Object.keys(exportData[0]);
      const rows = exportData.map(obj => Object.values(obj));
      
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 70, 229] } // indigo-600
      });

      const pdfOutput = doc.output();
      res.header("Content-Type", "application/pdf");
      res.attachment(`${filename}.pdf`);
      return res.send(Buffer.from(pdfOutput, 'binary'));
    }

  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ success: false, error: "Failed to generate export" });
  }
};
