import dotenv from "dotenv";
import express, { urlencoded } from 'express';
import path from "path";
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import fs from 'fs';
import cookieParser from "cookie-parser";
import cors from "cors";
import providerRouter from "./routes/Provider/providerRoutes.js";
import userRouter from "./routes/User/usersRoutes.js"
import contactRouter from "./routes/Contact/contactRoutes.js";
import ticketRouter from "./routes/Ticket/ticketsRoutes.js";
import propertyRouter from "./routes/Property/propertyRoutes.js";
import invoiceRouter from "./routes/Invoice/invoiceRoutes.js";
import legalRouter from "./routes/Legal/legalRoutes.js";
import reportRouter from "./routes/Report/reportsRoutes.js";
import clientRouter from "./routes/Client/clientsRoutes.js"
import accountsRouter from "./routes/Account/accountRoutes.js"
import rolesRouter from "./routes/Roles/rolesRoutes.js";


dotenv.config()

// BUG FIX FOR VIEWS
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


// settings
const expressApp = express()
expressApp.set('view engine', 'ejs');
expressApp.set("port", process.env.PORT || 3000);
expressApp.set('views', path.join(__dirname, 'views'));

// middleware that logs the IP of users
accountsRouter.use((req, res, next) => {
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
expressApp.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

// routes
expressApp.use("/clients", clientRouter);
expressApp.use("/providers", providerRouter);
expressApp.use("/users", userRouter);
expressApp.use("/contact", contactRouter);
expressApp.use("/tickets", ticketRouter);
expressApp.use("/accounts", accountsRouter);
expressApp.use("/properties", propertyRouter);
expressApp.use("/invoices", invoiceRouter);
expressApp.use("/legal", legalRouter);
expressApp.use("/reports", reportRouter);
expressApp.use("/roles", rolesRouter);

// starting the server
export default expressApp;
