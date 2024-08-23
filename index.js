import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';

const app = express();
const port = process.env.APP_PORT || 3000;

const db = new pg.Client({
    host : process.env.POSTGRES_HOST,
    database : process.env.POSTGRES_DATABASE,
    user : process.env.POSTGRES_USER,
    password : process.env.POSTGRES_PASSWORD,
    port : process.env.POSTGRES_PORT,
});
db.connect();


// Create tables if they don't exist
db.query(`CREATE TABLE IF NOT EXISTS public.location (
            division_id integer NOT NULL,
            division character varying(50) COLLATE pg_catalog."default",
            district character varying(50) COLLATE pg_catalog."default",
            taluk character varying(50) COLLATE pg_catalog."default",
            village_or_city character varying(50) COLLATE pg_catalog."default",
            khatha_or_property_no numeric NOT NULL,
            CONSTRAINT location_pk PRIMARY KEY (division_id),
            CONSTRAINT location_khatha_or_property_no_key UNIQUE (khatha_or_property_no)
        )
`);
db.query(`CREATE TABLE IF NOT EXISTS public.payment_of_property_tax_details(
            name_of_institution character varying(50) COLLATE pg_catalog."default",
            name_of_khathadar character varying(50) COLLATE pg_catalog."default",
            khatha_or_property_no integer NOT NULL,
            pid_no integer NOT NULL,
            dimension_of_vacant_area_in_sqft numeric,
            dimension_of_building_area_in_sqft numeric,
            total_dimension_in_sqft numeric,
            to_which_department_paid character varying(50) COLLATE pg_catalog."default",
            year_of_payment integer,
            receipt_no integer,
            property_tax numeric,
            rebate numeric,
            service_tax numeric,
            cesses numeric,
            interest numeric,
            penalty numeric,
            total_amount numeric,
            remarks character varying(100) COLLATE pg_catalog."default",
            CONSTRAINT payment_of_property_tax_details_pkey PRIMARY KEY (khatha_or_property_no)
        )
`);

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine","ejs");


app.get("/", async(req,res)=>{
    try {
        const result06 = await db.query("SELECT * FROM location JOIN payment_of_property_tax_details ON location.pid_no = payment_of_property_tax_details.pid_no ORDER BY location.pid_no ASC");
        const information = result06.rows;
        res.render("index01.ejs",{
        information : information,
        });
    return;
    } catch(err) {
        res.send("the database is empty or some error occured");
    }
    const result06 = await db.query("SELECT * FROM location JOIN payment_of_property_tax_details ON location.pid_no = payment_of_property_tax_details.pid_no ORDER BY location.pid_no ASC");
    const information = result06.rows;
    res.render("index01.ejs",{
        information : information,
    });
    return;
});

app.post("/new", async(req,res)=>{
    res.render("index02.ejs");
});

app.post("/submit", async(req,res)=>{
    const {
        divisionId,
        division,
        district,
        taluk,
        city,
        pid,
        institutionName,
        khathadarName,
        khathaNo,
        pidNum,
        vacantDimension,
        buildingDimension,
        totalDimension,
        department,
        paymentYear,
        receiptNo,
        propertyTax,
        rebate,
        serviceTax,
        cesses,
        interest,
        penalty,
        totalAmount,
        remarks
    } = req.body;
    
    console.log(division_id);

    try {
        await db.query("INSERT INTO location (division_id,division,district,taluk,village_or_city,pid_no) VALUES ($1,$2,$3,$4,$5,$6)",[division_id,division,district,taluk,city,pid]);
        await db.query("INSERT INTO payment_of_property_tax_details (name_of_institution,name_of_khathadar,khatha_or_property_no,pid_no,dimension_of_vacant_area_in_sqft,dimension_of_building_area_in_sqft,total_dimension_in_sqft,to_which_department_paid,year_of_payment,receipt_no,property_tax,rebate,service_tax,cesses,interest,penalty,total_amount,remarks) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)",[institution_name,khathadar_name,khatha_no,pid_num,vacant_dimension,building_dimension,total_dimension,department,payment_year,receipt_no,property_tax,rebate,service_tax,cesses,interest,penalty,total_amount,remarks]);
        console.log("the data added successfully");
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
});



app.listen(port,()=>{
    console.log(`the server is listening on the port ${port}`);
});