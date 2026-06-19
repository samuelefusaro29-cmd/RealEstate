--
-- PostgreSQL database dump
--

\restrict BbYC4VfWQciBOzzuIHoaVSu72IBSG3q1sqNCnzMGUU8DkIZU66kbb17Ogco2ute

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.4 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    surname character varying(50) NOT NULL,
    email character varying(50) NOT NULL,
    password character varying(60) NOT NULL
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: auctions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auctions (
    id integer NOT NULL,
    id_post integer NOT NULL,
    starting_price double precision NOT NULL,
    current_best double precision NOT NULL,
    end_date timestamp without time zone NOT NULL,
    is_closed boolean DEFAULT false NOT NULL,
    winner_id integer,
    current_winner_id integer
);


ALTER TABLE public.auctions OWNER TO postgres;

--
-- Name: bids; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bids (
    id integer NOT NULL,
    id_auction integer NOT NULL,
    id_user integer NOT NULL,
    amount double precision NOT NULL,
    placed_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bids OWNER TO postgres;

--
-- Name: blacklist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blacklist (
    email character varying(255) NOT NULL
);


ALTER TABLE public.blacklist OWNER TO postgres;

--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO postgres;

--
-- Name: photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.photos (
    id integer NOT NULL,
    url character varying(255) NOT NULL,
    post_id integer NOT NULL
);


ALTER TABLE public.photos OWNER TO postgres;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    title character varying(50) NOT NULL,
    description character varying(200) NOT NULL,
    previous_price numeric(10,2),
    current_price numeric(10,2) NOT NULL,
    created_at date DEFAULT CURRENT_DATE NOT NULL,
    id_seller integer,
    id_real_estate integer,
    transaction_type character varying(20) DEFAULT 'vendita'::character varying NOT NULL,
    is_auction boolean DEFAULT false NOT NULL,
    auction_end_time timestamp without time zone,
    listing_type character varying(10) DEFAULT 'SALE'::character varying NOT NULL,
    rental_price_monthly numeric(10,2),
    sold boolean DEFAULT false NOT NULL,
    CONSTRAINT posts_id_check CHECK (((id >= 10000) AND (id <= 99999)))
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- Name: real_estate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.real_estate (
    id integer NOT NULL,
    title character varying(50) NOT NULL,
    number_of_rooms integer,
    description character varying(1000) NOT NULL,
    square_metres numeric(8,2) NOT NULL,
    latit numeric(10,8) NOT NULL,
    longit numeric(10,8) NOT NULL,
    address character varying(200) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    type character varying(30) DEFAULT 'APPARTAMENTO'::character varying NOT NULL,
    floor integer,
    has_elevator boolean,
    has_garden boolean,
    has_pool boolean,
    number_of_floors integer,
    width numeric(6,2),
    height numeric(6,2),
    is_electric boolean,
    cubature numeric(10,2),
    land_use character varying(100),
    crop_type character varying(50),
    CONSTRAINT real_estate_id_check CHECK (((id >= 10000) AND (id <= 99999)))
);


ALTER TABLE public.real_estate OWNER TO postgres;

--
-- Name: rental_contract; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rental_contract (
    id integer NOT NULL,
    post_id integer NOT NULL,
    tenant_id integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    monthly_price numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rental_contract OWNER TO postgres;

--
-- Name: rental_contract_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rental_contract_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rental_contract_id_seq OWNER TO postgres;

--
-- Name: rental_contract_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rental_contract_id_seq OWNED BY public.rental_contract.id;


--
-- Name: rental_request; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rental_request (
    id integer NOT NULL,
    post_id integer NOT NULL,
    buyer_id integer NOT NULL,
    message text,
    desired_start date,
    desired_end date,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rental_request OWNER TO postgres;

--
-- Name: rental_request_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rental_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rental_request_id_seq OWNER TO postgres;

--
-- Name: rental_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rental_request_id_seq OWNED BY public.rental_request.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    title character varying(50) NOT NULL,
    description text,
    rating integer NOT NULL,
    created_at date DEFAULT CURRENT_DATE NOT NULL,
    id_user integer,
    id_post integer,
    CONSTRAINT reviews_id_check CHECK (((id >= 10000) AND (id <= 99999))),
    CONSTRAINT reviews_valutazione_check CHECK (((rating >= 0) AND (rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: sellers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sellers (
    id integer NOT NULL,
    vat_number character varying(11) NOT NULL,
    name character varying(50) NOT NULL,
    surname character varying(50) NOT NULL,
    email character varying(50) NOT NULL,
    birth_date date NOT NULL,
    password character varying(60) NOT NULL,
    is_banned boolean DEFAULT false NOT NULL,
    CONSTRAINT sellers_id_check CHECK (((id >= 10000) AND (id <= 99999)))
);


ALTER TABLE public.sellers OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    surname character varying(50) NOT NULL,
    email character varying(50) NOT NULL,
    birthdate date,
    password character varying(60),
    auth_provider character varying(10) DEFAULT 'LOCAL'::character varying NOT NULL,
    is_banned boolean DEFAULT false NOT NULL,
    CONSTRAINT users_id_check CHECK (((id >= 10000) AND (id <= 99999)))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: rental_contract id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rental_contract ALTER COLUMN id SET DEFAULT nextval('public.rental_contract_id_seq'::regclass);


--
-- Name: rental_request id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rental_request ALTER COLUMN id SET DEFAULT nextval('public.rental_request_id_seq'::regclass);


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, name, surname, email, password) FROM stdin;
10001	Admin	Admin	admin@admin.com	$2a$10$1k1z/Qs7SDHg1Ex0FOM2qeLNuzmJiIB8YYKrU.N3rVc7TiS7gWIsa
24855	samuele	fusaro	sa.fusaro@icloud.com	$2a$10$mRcfa914j5k3HvxPAGBgl.wdiFDHUxyCcBhjuRmkyeBFgLkd6QSn.
23636	Samuele	Fusaro	samuele.fusaro29@gmail.com	{oauth2}NO_PASSWORD
\.


--
-- Data for Name: auctions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auctions (id, id_post, starting_price, current_best, end_date, is_closed, winner_id, current_winner_id) FROM stdin;
\.


--
-- Data for Name: bids; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bids (id, id_auction, id_user, amount, placed_at) FROM stdin;
\.


--
-- Data for Name: blacklist; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blacklist (email) FROM stdin;
mario.rossi@prova.com
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
2	2	create users table	SQL	V2__create_users_table.sql	-2100496283	postgres	2026-05-05 18:20:49.618047	2	t
3	3	create admin table	SQL	V3__create_admin_table.sql	68982192	postgres	2026-05-05 18:20:49.625426	1	t
4	4	create seller table	SQL	V4__create_seller_table.sql	754061895	postgres	2026-05-05 18:20:49.630602	2	t
5	5	create post table	SQL	V5__create_post_table.sql	1189915630	postgres	2026-05-05 18:23:20.035901	29	t
7	7	create photo table	SQL	V7__create_photo_table.sql	2141750709	postgres	2026-05-05 18:24:39.081246	2	t
8	8	create blacklist table	SQL	V8__create_blacklist_table.sql	-1504257267	postgres	2026-05-05 18:24:39.087383	1	t
9	9	insert admin value	SQL	V9__insert_admin_value.sql	893510852	postgres	2026-05-05 18:24:39.092096	3	t
10	10	create auctions table	SQL	V10__create_auctions_table.sql	-1323661491	postgres	2026-05-07 10:38:40.250215	313	t
11	11	create bids table	SQL	V11__create_bids_table.sql	-1214035295	postgres	2026-05-07 10:38:40.605842	6	t
1	1	create real estate table	SQL	V1__create_real_estate_table.sql	-1233407157	postgres	2026-05-05 18:20:49.594129	11	t
12	12	create rental	SQL	V12__create_rental.sql	-2030210261	postgres	2026-05-20 18:45:37.088963	40	t
13	13	add current winner to auction	SQL	V13__add_current_winner_to_auction.sql	1319391198	postgres	2026-05-20 18:45:37.150041	6	t
14	14	add sold to posts	SQL	V14__add_sold_to_posts.sql	-1797924629	postgres	2026-05-26 17:36:41.873408	25	t
6	6	create review table	SQL	V6__create_review_table.sql	-897573954	postgres	2026-05-05 18:24:39.037968	25	t
15	15	rename buildinglot columns	SQL	V15__rename_buildinglot_columns.sql	-1610310258	postgres	2026-05-27 14:08:29.728437	10	t
16	16	extend description length	SQL	V16__extend_description_length.sql	844265267	postgres	2026-06-01 11:40:13.367411	38	t
\.


--
-- Data for Name: photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.photos (id, url, post_id) FROM stdin;
68234	https://pub-9d3d47e3f7684c4cb32821f4abcf197f.r2.dev/fbb60548-f501-4b28-8426-761f8f3b8a5d.png	56759
87639	https://pub-9d3d47e3f7684c4cb32821f4abcf197f.r2.dev/f362102b-4f47-4d64-b7b3-99fc4bf668e6.png	56759
23030	https://pub-9d3d47e3f7684c4cb32821f4abcf197f.r2.dev/c3d0c2bf-c453-4030-8877-f2865a5cadb7.png	56759
79514	https://pub-9d3d47e3f7684c4cb32821f4abcf197f.r2.dev/dead9f6e-76aa-418a-8989-91147b5b4469.png	55045
47013	https://pub-9d3d47e3f7684c4cb32821f4abcf197f.r2.dev/044c2a82-9fab-4d7d-b8f4-a118de6f86bf.png	55045
86868	https://pub-9d3d47e3f7684c4cb32821f4abcf197f.r2.dev/a7d20b59-2173-423d-ad04-c599a096135a.png	85612
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.posts (id, title, description, previous_price, current_price, created_at, id_seller, id_real_estate, transaction_type, is_auction, auction_end_time, listing_type, rental_price_monthly, sold) FROM stdin;
56759	Bellissima villa	Bellissima villa situata nella natura nei pressi di Paola CS	420000.00	420000.00	2026-06-19	46069	39316	vendita	f	\N	SALE	\N	f
55045	Appartamento Acri centro	Affittasi appartamento situato ad Acri centro molto comodo per le famiglie 	0.00	500.00	2026-06-19	46069	99611	vendita	f	\N	RENT	\N	f
85612	Box Auto Roma	Pratico Box Auto a Roma 	0.00	20000.00	2026-06-19	46069	90808	vendita	f	\N	SALE	\N	f
\.


--
-- Data for Name: real_estate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.real_estate (id, title, number_of_rooms, description, square_metres, latit, longit, address, created_at, type, floor, has_elevator, has_garden, has_pool, number_of_floors, width, height, is_electric, cubature, land_use, crop_type) FROM stdin;
39316	Bellissima villa	10	Bellissima villa situata nella natura nei pressi di Paola CS	500.00	39.35063760	16.04185440	Via Sottopromintesta 11, 87027 Paola (CS)	2026-06-19 15:40:59.702514	VILLA	\N	\N	f	f	0	\N	\N	\N	\N	\N	\N
99611	Appartamento Acri centro	5	Affittasi appartamento situato ad Acri centro molto comodo per le famiglie 	100.00	39.49013330	16.38233480	Via Roma 3, 87041 Acri (CS)	2026-06-19 16:31:25.495501	APARTMENT	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N
90808	Box Auto Roma	\N	Pratico Box Auto a Roma 	10.00	41.90237410	12.48938440	Via dei Giardini 66, 00817 Roma (RM)	2026-06-19 16:41:58.666035	GARAGE	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N
\.


--
-- Data for Name: rental_contract; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rental_contract (id, post_id, tenant_id, start_date, end_date, monthly_price, status, created_at) FROM stdin;
\.


--
-- Data for Name: rental_request; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rental_request (id, post_id, buyer_id, message, desired_start, desired_end, status, created_at) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, title, description, rating, created_at, id_user, id_post) FROM stdin;
78505	Bellissima Villa	Ho visitato la villa e l'ho trovata molto accogliente in tutto e per tutto\n	5	2026-06-19	55309	56759
\.


--
-- Data for Name: sellers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sellers (id, vat_number, name, surname, email, birth_date, password, is_banned) FROM stdin;
46069	IT123456789	Mario	Fuoco	mario.fuoco@example.com	2000-01-20	$2a$10$N.hL7FCXFCHJspr4xaMnO.jjtRI7c.sX5hXEy8n1QkU8Q8U1Nvrlm	f
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, surname, email, birthdate, password, auth_provider, is_banned) FROM stdin;
55309	Francesco	Eramo	francescoeramo4@gmail.com	2000-01-01	$2a$10$1k1z/Qs7SDHg1Ex0FOM2qeLNuzmJiIB8YYKrU.N3rVc7TiS7gWIsa	LOCAL	f
15732	mario	rossi	mario.rossi@prova.com	1990-01-01	$2a$10$vxRGKiLoyvauJxZDajtSUenGx2RQwUulqgrDB7rdwoo1gPekrsRE2	LOCAL	t
\.


--
-- Name: rental_contract_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rental_contract_id_seq', 4, true);


--
-- Name: rental_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rental_request_id_seq', 4, true);


--
-- Name: admins admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_key UNIQUE (email);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: auctions auctions_id_post_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auctions
    ADD CONSTRAINT auctions_id_post_key UNIQUE (id_post);


--
-- Name: auctions auctions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auctions
    ADD CONSTRAINT auctions_pkey PRIMARY KEY (id);


--
-- Name: bids bids_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_pkey PRIMARY KEY (id);


--
-- Name: blacklist blacklist_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blacklist
    ADD CONSTRAINT blacklist_pkey PRIMARY KEY (email);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: photos photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_pkey PRIMARY KEY (id);


--
-- Name: photos photos_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_url_key UNIQUE (url);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: real_estate real_estate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.real_estate
    ADD CONSTRAINT real_estate_pkey PRIMARY KEY (id);


--
-- Name: rental_contract rental_contract_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rental_contract
    ADD CONSTRAINT rental_contract_pkey PRIMARY KEY (id);


--
-- Name: rental_request rental_request_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rental_request
    ADD CONSTRAINT rental_request_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: sellers sellers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sellers
    ADD CONSTRAINT sellers_email_key UNIQUE (email);


--
-- Name: sellers sellers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sellers
    ADD CONSTRAINT sellers_pkey PRIMARY KEY (id);


--
-- Name: sellers sellers_vatnumber_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sellers
    ADD CONSTRAINT sellers_vatnumber_key UNIQUE (vat_number);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_rental_con_post; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rental_con_post ON public.rental_contract USING btree (post_id);


--
-- Name: idx_rental_con_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rental_con_tenant ON public.rental_contract USING btree (tenant_id);


--
-- Name: idx_rental_req_buyer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rental_req_buyer ON public.rental_request USING btree (buyer_id);


--
-- Name: idx_rental_req_post; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rental_req_post ON public.rental_request USING btree (post_id);


--
-- Name: auctions auctions_id_post_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auctions
    ADD CONSTRAINT auctions_id_post_fkey FOREIGN KEY (id_post) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: auctions auctions_winner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auctions
    ADD CONSTRAINT auctions_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: bids bids_id_auction_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_id_auction_fkey FOREIGN KEY (id_auction) REFERENCES public.auctions(id) ON DELETE CASCADE;


--
-- Name: bids bids_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: auctions fk_auction_current_winner; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auctions
    ADD CONSTRAINT fk_auction_current_winner FOREIGN KEY (current_winner_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: photos photos_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id);


--
-- Name: posts posts_idrealestate_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_idrealestate_fkey FOREIGN KEY (id_real_estate) REFERENCES public.real_estate(id);


--
-- Name: posts posts_idseller_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_idseller_fkey FOREIGN KEY (id_seller) REFERENCES public.sellers(id);


--
-- Name: rental_contract rental_contract_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rental_contract
    ADD CONSTRAINT rental_contract_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: rental_request rental_request_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rental_request
    ADD CONSTRAINT rental_request_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_id_post_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_id_post_fkey FOREIGN KEY (id_post) REFERENCES public.posts(id);


--
-- PostgreSQL database dump complete
--

\unrestrict BbYC4VfWQciBOzzuIHoaVSu72IBSG3q1sqNCnzMGUU8DkIZU66kbb17Ogco2ute

