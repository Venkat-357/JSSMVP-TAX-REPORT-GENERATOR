const createTablesIfNotExists = (db) => {
    if (!db) {
        console.log('Error: No Database Connection object provided to create the tables. ABORTING!');
        return;
    }

    db.query(`CREATE TABLE IF NOT EXISTS public.admins (
            email character varying(50) PRIMARY KEY COLLATE pg_catalog."default",
            password character varying(50) COLLATE pg_catalog."default"
        )
    `);

    db.query(`CREATE TABLE IF NOT EXISTS public.division_users (
            division_id bigint PRIMARY KEY,
            division character varying(50) COLLATE pg_catalog."default",
            email character varying(50) UNIQUE COLLATE pg_catalog."default",
            password character varying(50) COLLATE pg_catalog."default",
            phone bigint UNIQUE
        )
    `);

    // db.query(`CREATE TABLE IF NOT EXISTS public.institution_users (
    //             institution_id bigint PRIMARY KEY,
    //             institution_name character varying(50) COLLATE pg_catalog."default",
    //             email character varying(50) UNIQUE COLLATE pg_catalog."default",
    //             password character varying(50) COLLATE pg_catalog."default",
    //             phone bigint UNIQUE
    //         )
    // `);

    db.query(`CREATE TABLE IF NOT EXISTS public.location (
            division_id bigint,
            division character varying(50) COLLATE pg_catalog."default",
            district character varying(50) COLLATE pg_catalog."default",
            taluk character varying(50) COLLATE pg_catalog."default",
            village_or_city character varying(50) COLLATE pg_catalog."default",
            khatha_or_property_no bigint PRIMARY KEY,
            CONSTRAINT fk_division_id FOREIGN KEY (division_id) REFERENCES public.division_users (division_id) ON DELETE CASCADE ON UPDATE CASCADE
        )
    `);
    db.query(`CREATE TABLE IF NOT EXISTS public.payment_of_property_tax_details (
            sno SERIAL PRIMARY KEY,
            pid_no bigint DEFAULT -1,
            name_of_institution character varying(50) COLLATE pg_catalog."default",
            name_of_khathadar character varying(50) COLLATE pg_catalog."default",
            khatha_or_property_no bigint, 
            dimension_of_vacant_area_in_sqft real,
            dimension_of_building_area_in_sqft real,
            total_dimension_in_sqft real,
            to_which_department_paid character varying(50) COLLATE pg_catalog."default",
            year_of_payment integer,
            receipt_no bigint,
            property_tax real,
            rebate real,
            service_tax real,
            cesses real,
            interest real,
            penalty real,
            total_amount real,
            remarks character varying(100) COLLATE pg_catalog."default",
            CONSTRAINT year_of_payment CHECK (year_of_payment >= 1900),
            CONSTRAINT fk_khatha_or_property_no FOREIGN KEY (khatha_or_property_no) REFERENCES public.location (khatha_or_property_no) ON DELETE CASCADE ON UPDATE CASCADE
        )
    `);
    db.query(`CREATE TABLE IF NOT EXISTS images (
        sno int PRIMARY KEY,
        filename VARCHAR(255),
        filetype VARCHAR(50),
        data BYTEA,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_sno FOREIGN KEY (sno) REFERENCES public.payment_of_property_tax_details (sno) ON DELETE CASCADE ON UPDATE CASCADE
    )`)
    console.log('Tables Created Successfully!');
}

export default createTablesIfNotExists;