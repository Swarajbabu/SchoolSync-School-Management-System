# SchoolSync / EduPlus Database Schema & Entity-Relationship Architecture

This document specifies the database architecture, entity relationships, relational integrity rules, and indexing strategy across the 10 core MongoDB collections.

---

## 1. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USER ||--o{ ATTENDANCE : "has attendance records"
    USER ||--o{ FEE : "has fee dues/invoices"
    USER ||--o{ PAYMENT : "makes payments"
    USER ||--o{ SESSIONAL_MARK : "earns marks"
    USER ||--o{ STAFF_ATTENDANCE : "faculty check-ins"
    USER ||--o{ MATERIAL : "faculty uploads"
    USER ||--o{ NOTICE : "authors bulletins"
    USER ||--o{ AUDIT_LOG : "triggers actions"
    TIMETABLE }|--|| USER : "taught by faculty"
    FEE ||--o{ PAYMENT : "reconciled through"

    USER {
        ObjectId _id PK
        string name
        string email UK
        string password
        string role "admin | teacher | student | guardian"
        string rollNo "Student roll number"
        string class "Current enrolled grade"
        string section "Current enrolled section"
        string contactNumber
        string bloodGroup
        string fatherName
        string motherName
        string teacherId "Faculty employee identifier"
        string department "Faculty academic department"
        number monthlySalary "Faculty payroll base"
        string status "Active | Inactive"
        string accessProtocol "e.g. ADMIN_SECURE_V1"
        Date createdAt
        Date updatedAt
    }

    ATTENDANCE {
        ObjectId _id PK
        ObjectId student FK "Ref: User"
        string class "Target class (e.g. 10)"
        string section "Target section (e.g. A)"
        string date "MM/DD/YYYY format"
        string period "Daily (Full Day) | Period 1-8"
        string status "present | absent | late"
        ObjectId markedBy FK "Ref: User (Faculty)"
        Date createdAt
    }

    FEE {
        ObjectId _id PK
        ObjectId student FK "Ref: User"
        string class
        string section
        string month "Billing Month (e.g. November)"
        string year "Academic Year (e.g. 2026)"
        number totalAmount "Tuition invoice baseline"
        number paidAmount "Total collected"
        string settlementStatus "PENDING | PARTIAL | PAID"
        Date createdAt
        Date updatedAt
    }

    PAYMENT {
        ObjectId _id PK
        ObjectId fee FK "Ref: Fee"
        ObjectId student FK "Ref: User"
        number amount "Discrete payment quantum"
        string paymentMethod "Cash | UPI | Card | Bank Transfer"
        string transactionId UK "Unique txn hash"
        string receiptNumber UK "Official invoice identifier"
        ObjectId receivedBy FK "Ref: User (Cashier/Admin)"
        Date paidAt
    }

    TIMETABLE {
        ObjectId _id PK
        string class
        string section
        string day "Monday - Saturday"
        number period "1 to 8"
        string timeSlot "e.g. 09:00 AM - 09:45 AM"
        string subjectName
        string subjectCode
        ObjectId faculty FK "Ref: User (Teacher)"
        string facultyName
        string roomNumber
    }

    SESSIONAL_MARK {
        ObjectId _id PK
        ObjectId student FK "Ref: User"
        string class
        string section
        string assessmentType "1st Sessional | 2nd Sessional | Mid-Term"
        string subject
        number maximumMarks "Base score denominator"
        number marksObtained "Student score numerator"
        string grade "A+ | A | B | C | F"
        string status "PASS | FAIL"
        string remarks "Evaluator notes"
        ObjectId evaluatedBy FK "Ref: User"
    }

    EXAM {
        ObjectId _id PK
        string examName "e.g. Mathematics Mid-Term"
        string targetClass "Target class"
        string examDate "DD/MM/YYYY"
        string description "Hall and syllabus instructions"
        ObjectId createdBy FK "Ref: User"
    }

    NOTICE {
        ObjectId _id PK
        string title
        string content
        string category "General | Exam | Holiday | Fees"
        string audience "EVERYONE | TEACHER | STUDENT"
        ObjectId publishedBy FK "Ref: User"
        Date createdAt
    }

    MATERIAL {
        ObjectId _id PK
        string title
        string targetClass
        string section "Specific section or All Sections"
        string category "STUDY MATERIAL | PAPER | HOMEWORK"
        string subject
        string link "URL or storage reference"
        ObjectId uploadedBy FK "Ref: User"
    }

    AUDIT_LOG {
        ObjectId _id PK
        string action "e.g. FEE_PAYMENT_COLLECTED"
        ObjectId performedBy FK "Ref: User"
        string targetEntity "e.g. Fee | Attendance"
        string ipAddress
        string userAgent
        Object details "State delta payload"
        Date timestamp
    }
```

---

## 2. Collections & Relational Architecture

### 2.1 User Collection (`users`)
- **Primary Identifier**: `_id` (`ObjectId`).
- **Natural Keys**:
  - `email`: Enforced unique index `{ email: 1 }` (lowercased, trimmed).
  - `rollNo`: Indexed for student lookups `{ rollNo: 1 }`.
- **Inheritance Pattern**: Single-table inheritance containing role-discriminated fields (`student`, `teacher`, `admin`, `guardian`).
- **Security**: Passwords salted and hashed with `bcryptjs` (cost factor 10); stripped on all public projections (`select('-password')`).

### 2.2 Attendance Collection (`attendances`)
- **Composite Unique Index**: `{ student: 1, date: 1, period: 1 }` ensures zero duplicate roll-call records for the same student on the same date and lecture block.
- **Query Optimizations**: Indexed on `{ class: 1, section: 1, date: 1 }` to serve real-time roll-call rosters in $<5\text{ms}$.

### 2.3 Fee Collection (`fees`)
- **Composite Unique Index**: `{ student: 1, month: 1, year: 1 }` guarantees atomic monthly invoices.
- **Computed Attributes**:
  - `balanceDue = Math.max(0, totalAmount - paidAmount)`
  - `settlementStatus`: Auto-evaluated (`paidAmount >= totalAmount ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING'`).

### 2.4 Timetable Collection (`timetables`)
- **Period Conflict Prevention**: Indexed on `{ class: 1, section: 1, day: 1, period: 1 }` and `{ faculty: 1, day: 1, period: 1 }` to prevent dual-booking a classroom or an instructor at the same hour.

---

## 3. Dynamic Database Discovery Engine

Rather than hardcoding arbitrary class integers or static section arrays in the client, the backend dynamically queries student demographics:

```javascript
// Aggregation pipeline from User collection
const studentClasses = await User.aggregate([
  { $match: { role: "student", class: { $exists: true, $nin: ["", "Unassigned", null] } } },
  { $group: { _id: "$class", sections: { $addToSet: "$section" } } },
  { $sort: { _id: 1 } }
]);
```

This guarantees that any school adopting the software immediately renders its own active structure (e.g., Nursery to Grade 12, or Class 1 to 10 with Section A, B, C) without code modifications.
