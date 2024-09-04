import dotenv from "dotenv";
import express, { urlencoded } from 'express';
import path from "path";
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import fs from 'fs';
import cookieParser from "cookie-parser";
import cors from "cors";
import accountRouter from './routes/usersRoutes.js';
import userRouter from "./routes/usersRoutes.js";
import productRouter from "./routes/productsRoutes.js";
import contactRouter from "./routes/contactRoutes.js";
import ticketRouter from "./routes/ticketsRoutes.js";
import accountsRouter from "./routes/accountRoutes.js";
import propertyRouter from "./routes/propertyRoutes.js";
import invoiceRouter from "./routes/invoiceRoutes.js";
import legalRouter from "./routes/legalRoutes.js";
import providerRouter from "./routes/providerRoutes.js";
import clientRouter from "./routes/clientsRoutes.js";
import reportRouter from "./routes/reportsRoutes.js";

dotenv.config()

// BUG FIX FOR VIEWS
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const videoDir = path.join(__dirname, 'uploads/videos');
if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
}

// settings
const expressApp = express()
expressApp.set('view engine', 'ejs');
expressApp.set("port", process.env.PORT || 3000);
expressApp.set('views', path.join(__dirname, 'views'));

// middleware that logs the IP of users
accountRouter.use((req, res, next) => {
    console.log(req.ip);
    next();
}); 

// middleware that logs the IP of products
productRouter.use((req, res, next) => {
    console.log(req.ip);
    next();
});

// middlewares
expressApp.use(morgan('dev'));
expressApp.use(express.urlencoded({ extended: false }));
expressApp.use(cookieParser());
expressApp.use(express.text());
expressApp.use(express.json());
expressApp.use(cors());

// static files
expressApp.use(express.static(path.join(__dirname, 'public')));
expressApp.use('/uploads', express.static(path.join(__dirname, 'uploads')));  // Sirviendo archivos de la carpeta 'uploads'

// routes
expressApp.use("/clients", clientRouter);
expressApp.use("/providers", providerRouter);
expressApp.use("/users", userRouter);
expressApp.use("/products", productRouter);
expressApp.use("/contact", contactRouter);
expressApp.use("/tickets", ticketRouter);
expressApp.use("/accounts", accountsRouter);
expressApp.use("/properties", propertyRouter);
expressApp.use("/invoices", invoiceRouter);
expressApp.use("/legals", legalRouter);
expressApp.use("/reports", reportRouter);

// starting the server
export default expressApp;
