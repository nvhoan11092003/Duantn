import dotenv from "dotenv";
import express from "express"
import morgan from "morgan";
import cors from "cors";
import connectDB from "./config/database";
import ProductRouter from "./routes/products";
import authRouter from "./routes/auth";
import voucherRouter from "./routes/voucher";
import passwordRouter from "./routes/password";
import categoryRouter from "./routes/categories";
import uploadRouter from "./routes/upload";
import contactRouter from "./routes/contact";
import brandRouter from "./routes/brand";
import attributeRouter from "./routes/color";
import valueattributeRouter from "./routes/valueattibute";
import productvariantRouter from "./routes/productvariant";
import orderRouter from "./routes/order";
import size from "./routes/size";
import color from "./routes/color";
import comment from "./routes/comment";
import productDiscount from "./routes/productDistcount"
import payment from "./routes/payment";


// import cartRouter from "./routes/cart";






const app = express();

dotenv.config();

// connect db
connectDB( process.env.MONGO_URI )

app.use( express.json() );
app.use( morgan( "tiny" ) );
app.use( cors() )
// app.use( "/api/cart", cartRouter );
app.use( '/auth', authRouter )
app.use( '/password', passwordRouter )
app.use( '/category', categoryRouter )
app.use( '/images', uploadRouter )
app.use( "/voucher", voucherRouter );
app.use( "/products", ProductRouter );
app.use( "/contact", contactRouter );
app.use( "/brand", brandRouter );
app.use( "/attribute", attributeRouter );
app.use( "/valueattribute", valueattributeRouter );
app.use( "/productvariant", productvariantRouter );
app.use( "/order", orderRouter );
app.use( "/color", color );
app.use( "/size", size );
app.use( "/comment", comment );
app.use( "/productDiscount", productDiscount );

app.use( "/payment", payment );



export const viteNodeApp = app;
export default app
// 