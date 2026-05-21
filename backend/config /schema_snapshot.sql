-- ----------------------------------------------------------------
-- 1. HOSTEL
-- ----------------------------------------------------------------
CREATE TABLE Hostel (
    hostel_id        INT           NOT NULL AUTO_INCREMENT,
    hostel_name      VARCHAR(120)  NOT NULL,
    address          TEXT          NOT NULL,
    city             VARCHAR(80)   NOT NULL,
    total_rooms      INT           NOT NULL CHECK (total_rooms > 0),
    contact_phone    VARCHAR(20)   NOT NULL,
    email            VARCHAR(100)  NOT NULL UNIQUE,
    established_yr   YEAR,
    warden_id        INT,
    PRIMARY KEY (hostel_id)
);

-------------------------------------------------------------------
-- 2. WARDEN
-- ----------------------------------------------------------------
CREATE TABLE Warden (
    warden_id  INT          NOT NULL AUTO_INCREMENT,
    full_name  VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL UNIQUE,
    phone      VARCHAR(20)  NOT NULL,
    cnic       VARCHAR(15)  NOT NULL UNIQUE,
    PRIMARY KEY (warden_id),
);

ALTER TABLE Hostel
    ADD CONSTRAINT fk_hostel_warden
        FOREIGN KEY (warden_id) REFERENCES Warden(warden_id)
        ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------------------------------------------
-- 3. ROOM
-- ----------------------------------------------------------------
CREATE TABLE Room (
    room_id      INT                                       NOT NULL AUTO_INCREMENT,
    room_number  VARCHAR(5)                               NOT NULL,
    floor        INT                                       NOT NULL DEFAULT 0,
    room_type    ENUM('Single','Double','Triple','Quad')   NOT NULL,
    capacity     INT                                       NOT NULL,
    monthly_fee  DECIMAL(10,2)                            NOT NULL CHECK (monthly_fee >= 0),
    status       ENUM('Available','Occupied','Under Maintenance')
                                                           NOT NULL DEFAULT 'Available',
    hostel_id    INT                                       NOT NULL,
    PRIMARY KEY (room_id),
    UNIQUE KEY uq_room (hostel_id, room_number),
    CONSTRAINT fk_room_hostel
        FOREIGN KEY (hostel_id) REFERENCES Hostel(hostel_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ----------------------------------------------------------------
-- 4. STUDENT
-- ----------------------------------------------------------------
CREATE TABLE Student (
    student_id     INT          NOT NULL AUTO_INCREMENT,
    roll_number    VARCHAR(20)  NOT NULL UNIQUE,
    full_name      VARCHAR(100) NOT NULL,
    email          VARCHAR(100) NOT NULL UNIQUE,
    phone          VARCHAR(20)  NOT NULL,
    department     VARCHAR(100) NOT NULL,
    program        VARCHAR(60)  NOT NULL,
    guardian_name  VARCHAR(100),
    guardian_phone VARCHAR(20),
    join_date      DATE         NOT NULL,
    status         ENUM('Active','Vacated','Suspended') NOT NULL DEFAULT 'Active',
    PRIMARY KEY (student_id)
);

-- ----------------------------------------------------------------
-- 5. STAFF
-- ----------------------------------------------------------------
CREATE TABLE Staff (
    staff_id   INT                               NOT NULL AUTO_INCREMENT,
    full_name  VARCHAR(100)                      NOT NULL,
    role       VARCHAR(60)                       NOT NULL,
    phone      VARCHAR(20)                       NOT NULL,
    email      VARCHAR(100)                      UNIQUE,
    salary     DECIMAL(10,2)                    NOT NULL CHECK (salary >= 0),
    hostel_id  INT                               NOT NULL,
    PRIMARY KEY (staff_id),
    CONSTRAINT fk_staff_hostel
        FOREIGN KEY (hostel_id) REFERENCES Hostel(hostel_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ----------------------------------------------------------------
-- 6. ALLOCATION  (Student <-> Room associative table)
-- ----------------------------------------------------------------
CREATE TABLE Allocation (
    student_id      INT     NOT NULL,
    room_id         INT     NOT NULL,
    allocated_date  DATE    NOT NULL,
    vacated_date    DATE,
    bed_id enum('1','2','3','4','5') NOT NULL,
    PRIMARY KEY (student_id),
    UNIQUE KEY unique_bed_room (room_id, bed_id),
    CONSTRAINT fk_alloc_student
        FOREIGN KEY (student_id) REFERENCES Student(student_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_alloc_room
        FOREIGN KEY (room_id) REFERENCES Room(room_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ----------------------------------------------------------------
-- 7. FEE_PAYMENT
-- ----------------------------------------------------------------
CREATE TABLE FeePayment (
    payment_id    INT                                        NOT NULL AUTO_INCREMENT,
    student_id    INT                                        NOT NULL,
    amount        DECIMAL(10,2)                             NOT NULL CHECK (amount > 0),
    payment_date  DATE                                       NOT NULL,
    due_date      DATE                                       NOT NULL,
    month_year    VARCHAR(10)                                NOT NULL,
    method        ENUM('Cash','Bank Transfer','Online','Cheque') NOT NULL,
    status        ENUM('Paid','Pending','Overdue')           NOT NULL DEFAULT 'Pending',
    remarks       VARCHAR(255),
    PRIMARY KEY (payment_id),
    CONSTRAINT fk_payment_student
        FOREIGN KEY (student_id) REFERENCES Student(student_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ================================================================
--  END OF SCHEMA  |  7 tables total
-- ================================================================
