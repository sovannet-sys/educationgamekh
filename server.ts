import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

const DATA_DIR = path.join(process.cwd(), "data");
const TEMPLATES_FILE = path.join(DATA_DIR, "templates.json");

const DEFAULT_TEMPLATES = {
  cardTemplates: [
    { name: "លេខគូ (2-20)", values: "2, 4, 6, 8, 10, 12, 14, 16, 18, 20" },
    { name: "លេខសេស (1-19)", values: "1, 3, 5, 7, 9, 11, 13, 15, 17, 19" },
    { name: "មេគុណ ៥ (5-50)", values: "5, 10, 15, 20, 25, 30, 35, 40, 45, 50" },
    { name: "លេខការ៉េ (1-100)", values: "1, 4, 9, 16, 25, 36, 49, 64, 81, 100" },
    { name: "ឈ្មោះក្រុមសិស្ស", values: "ក្រុមទី១, ក្រុមទី២, ក្រុមទី៣, ក្រុមទី៤, ក្រុមទី៥" },
  ],
  wheelTemplates: [
    { name: "ប្រមាណវិធីគណិត (+, -, ×, ÷)", values: "+, -, ×, ÷" },
    { name: "ពិន្ទុ (10, 20, 50, 100, លាភ)", values: "10, 20, 50, 100, ផ្កាយ, 0, លាក់" },
    { name: "លេខ ១ ដល់ ៨", values: "1, 2, 3, 4, 5, 6, 7, 8" },
    { name: "លេខគូ (2, 4, 6, 8, 10)", values: "2, 4, 6, 8, 10" },
    { name: "ប្រធានបទលំហាត់", values: "បូក, ដក, គុណ, ចែក, រកx, គិតរហ័ស" },
  ],
  riddles: [
    {
      id: "r1",
      question: "អីគេ ក្បាលពីរ ជើងប្រាំបី ដើរថយក្រោយ?",
      answer: "ក្តាម",
      options: ["ក្តាម", "បង្កង", "សត្វពីងពាង", "អណ្តើក"],
      hint: "ជាសត្វរស់នៅក្នុងទឹក និងស្រែចម្ការ មានដង្កៀបធំពីរ"
    },
    {
      id: "r2",
      question: "ស្លឹកមួយធ្នាប់ កប់ដីមិនរលួយ?",
      answer: "ក្រចក",
      options: ["ក្រចក", "កាក់", "ដបជ័រ", "ថ្ម"],
      hint: "វាដុះនៅលើម្រាមដៃ និងម្រាមជើងរបស់យើង"
    },
    {
      id: "r3",
      question: "បោះទៅសៗ ទាញមកខ្មៅៗ?",
      answer: "ដីស",
      options: ["ដីស", "អំបោះ", "សំណាញ់", "ខ្មៅដៃ"],
      hint: "ប្រើសម្រាប់សរសេរលើក្តារខៀនសាលារៀន"
    },
    {
      id: "r4",
      question: "ដើមប៉ុនម្រាមដៃ ផ្លែចង្រ្គាងមេឃ?",
      answer: "ម្ទេស",
      options: ["ម្ទេស", "ពោត", "ផ្កាឈូករ័ត្ន", "ត្រប់"],
      hint: "មានរសជាតិហឹរខ្លាំង ពេញនិយមក្នុងម្ហូបខ្មែរ"
    },
    {
      id: "r5",
      question: "ចងវាវាដើរ ស្រាយវាវាដេក?",
      answer: "ស្បែកជើង",
      options: ["ស្បែកជើង", "ឆត្រ", "ខ្សែចង", "រទេះ"],
      hint: "របស់ដែលយើងពាក់ជាប់នឹងជើងរៀងរាល់ថ្ងៃ"
    }
  ],
  spellings: [
    {
      id: "s1",
      clue: "កន្លែងសិស្សរៀនសូត្រ និងក្រេបជញ្ជក់ចំណេះដឹង",
      incomplete: "សា_រៀន",
      missing: "លា",
      options: ["លា", "ឡា", "ល្លា", "ណា"],
      fullWord: "សាលារៀន"
    },
    {
      id: "s2",
      clue: "សត្វចតុប្បាទមានបំពង់កវែងជាងគេលើលោក",
      incomplete: "សត្វវិ_ប",
      missing: "រា",
      options: ["រា", "យ៉ា", "ឡា", "ដា"],
      fullWord: "សត្វវិរាប"
    },
    {
      id: "s3",
      clue: "ផ្លែឈើស្ដេចកោះមានបន្លាស្រួចៗ និងក្លិនក្រអូបឈ្ងុយពិសេស",
      incomplete: "ធុ_ន",
      missing: "រេ",
      options: ["រេ", "រ៉េ", "ឡេ", "យ៉េ"],
      fullWord: "ធុរេន"
    },
    {
      id: "s4",
      clue: "អ្នកការពារសន្តិសុខ សណ្តាប់ធ្នាប់ និងសុវត្ថិភាពសង្គម",
      incomplete: "នគរ_ល",
      missing: "បាល",
      options: ["បាល", "បារ", "បាឡ", "បាល់"],
      fullWord: "នគរបាល"
    },
    {
      id: "s5",
      clue: "សត្វល្អិតមានស្លាប ឧស្សាហ៍ព្យាយាមក្រេបលំអងផ្កាធ្វើទឹកផ្អែម",
      incomplete: "សត្វឃ្មុ_",
      missing: "ំ",
      options: ["ំ", "ុំ", "ាំ", "ះ"],
      fullWord: "សត្វឃ្មុំ"
    }
  ],
  updatedAt: new Date().toISOString()
};

function readTemplatesFromFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(TEMPLATES_FILE)) {
      const raw = fs.readFileSync(TEMPLATES_FILE, "utf-8");
      return JSON.parse(raw);
    }
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(DEFAULT_TEMPLATES, null, 2), "utf-8");
    return DEFAULT_TEMPLATES;
  } catch (err) {
    console.error("Error reading templates file:", err);
    return DEFAULT_TEMPLATES;
  }
}

let sseClients: express.Response[] = [];

function broadcastTemplates(data: any) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(res => {
    try {
      res.write(payload);
    } catch {
      // Ignored - will be cleaned up on close
    }
  });
}

function writeTemplatesToFile(data: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const current = readTemplatesFromFile();
    const payload = {
      cardTemplates: Array.isArray(data.cardTemplates) ? data.cardTemplates : current.cardTemplates,
      wheelTemplates: Array.isArray(data.wheelTemplates) ? data.wheelTemplates : current.wheelTemplates,
      riddles: Array.isArray(data.riddles) ? data.riddles : current.riddles,
      spellings: Array.isArray(data.spellings) ? data.spellings : current.spellings,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(payload, null, 2), "utf-8");
    broadcastTemplates(payload);
    return payload;
  } catch (err) {
    console.error("Error writing templates file:", err);
    throw err;
  }
}

async function startServer() {
  // 1. API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Server-Sent Events (SSE) for Real-Time synchronization across all devices
  app.get("/api/templates/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Send initial data immediately
    const initialData = readTemplatesFromFile();
    res.write(`data: ${JSON.stringify(initialData)}\n\n`);

    sseClients.push(res);

    // Keep connection alive with ping every 15s
    const keepAliveTimer = setInterval(() => {
      try {
        res.write(": keepalive\n\n");
      } catch {
        clearInterval(keepAliveTimer);
      }
    }, 15000);

    req.on("close", () => {
      clearInterval(keepAliveTimer);
      sseClients = sseClients.filter(c => c !== res);
    });
  });

  app.get("/api/templates", (_req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      const templates = readTemplatesFromFile();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to load templates" });
    }
  });

  app.post("/api/templates", (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      const updated = writeTemplatesToFile(req.body);
      res.json({ success: true, templates: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to save templates" });
    }
  });

  // 2. Vite Middleware for Development / Static serving for Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
