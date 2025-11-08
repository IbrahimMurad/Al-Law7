# Quran Manuscript Tracker - Project Documentation

## 1. Project Overview

### 1.1 Purpose
A web application designed to help a Sheikh track and manage Quran manuscript recitations (loo7 - لوح) for their students using his mobile phone. The system facilitates the daily assignment, tracking, and evaluation of Quran memorization tasks.

### 1.2 Primary User
- **Sheikh (Administrator)**: The sole user with full access to manage students and their daily recitation assignments.

### 1.3 Core Functionality
- Student management (CRUD operations)
- Daily manuscript (loo7) assignment creation
- Quran text retrieval via external API
- Daily student recitation tracking
- Performance evaluation and feedback system

---

## 2. Key Concepts & Terminology

### 2.1 Loo7 (لوح)
A "manuscript" or "tablet" - represents a portion of the Quran that a student must recite on a specific day for memorization review.

### 2.2 Loo7 Types
Each loo7 is categorized by memorization recency:
- **New (جديد)**: Recently memorized verses
- **Near Past (قريب)**: Verses memorized in the recent past
- **Far Past (بعيد)**: Verses memorized long ago

### 2.3 Daily Assignment
- Typically 3 loo7 per student per day (one of each type)
- Friday is usually off (no assignments)
- Default recitation date: Tomorrow

---

## 3. Functional Requirements

### 3.1 Student Management

#### 3.1.1 Add Student
- **Inputs**: Student name, additional details (age, contact info, notes - optional)
- **Output**: New student record created
- **Validation**: Name is required

#### 3.1.2 Update Student
- **Inputs**: Modified student information
- **Output**: Updated student record
- **Validation**: Student must exist

#### 3.1.3 Delete Student
- **Inputs**: Student ID
- **Output**: Student record removed
- **Consideration**: Handle associated loo7 records (cascade delete or archive)

#### 3.1.4 View Students
- **Output**: List of all students with basic information
- **Actions**: Edit, Delete, Create Loo7

---

### 3.2 Loo7 (Manuscript) Management

#### 3.2.1 Create Loo7
- **Inputs**:
  - Student selection
  - Loo7 type (New, Near Past, Far Past)
  - Recitation date (default: tomorrow)
  - Surah selection
  - Starting Aya number (within selected Surah)
  - Ending Aya number (within selected Surah)
- **Process**:
  1. Sheikh selects Surah from dropdown
  2. System loads available Ayat for that Surah
  3. Sheikh selects start and end Aya numbers
  4. System stores Surah info and Aya range
- **Output**: New loo7 record created
- **Validation**:
  - End Aya must be >= Start Aya
  - Ayat must exist in selected Surah
  - Date must be valid

#### 3.2.2 View Daily Assignments
- **Input**: Selected date (default: today)
- **Output**: List of students who have loo7 scheduled for that date
- **Display**: Student name, number of loo7 for the day

#### 3.2.3 View Student's Daily Loo7
- **Input**: Student selection, date
- **Output**: All loo7 (1-3) assigned to student for that date
- **Display**: Loo7 type, Surah name, Aya range, status

#### 3.2.4 View Loo7 Text
- **Input**: Loo7 selection
- **Process**: 
  1. Retrieve Surah and Aya range from loo7 record
  2. Fetch Quran text from API for the specified range
  3. Display Arabic text with Aya numbers
- **Output**: Quran text for the specified Aya range

---

### 3.3 Evaluation & Feedback

#### 3.3.1 Score Options
- **Excellent (ممتاز)**: Perfect recitation
- **Good (جيد)**: Good recitation with minor errors
- **Weak (ضعيف)**: Poor recitation, needs improvement
- **Repeat (إعادة)**: Must recite again the next day

#### 3.3.2 Scoring Process
- **Input**: Loo7 ID, Score selection, optional notes
- **Output**: Loo7 marked as completed with score
- **Special Case - Repeat**:
  - When "Repeat" is selected:
    1. Mark current loo7 as completed with "Repeat" status
    2. Automatically create a new loo7 with:
       - Same student
       - Same type
       - Same Surah and Aya range
       - New date (next scheduled day)

---

## 4. Data Models

### 4.1 Student
```
{
  id: string/number (unique identifier)
  name: string (required)
  age: number (optional)
  contact: string (optional)
  notes: string (optional)
  createdAt: datetime
  updatedAt: datetime
}
```

### 4.2 Loo7 (Manuscript)
```
{
  id: string/number (unique identifier)
  studentId: string/number (foreign key)
  type: enum ['new', 'near_past', 'far_past']
  recitationDate: date
  surahNumber: number (1-114)
  surahName: string (Arabic)
  startAyaNumber: number (Aya number within Surah)
  endAyaNumber: number (Aya number within Surah)
  status: enum ['pending', 'completed']
  score: enum ['excellent', 'good', 'weak', 'repeat'] (null until completed)
  scoreNotes: string (optional)
  createdAt: datetime
  completedAt: datetime (null until completed)
}
```

### 4.3 Data Relationships
- One Student → Many Loo7 (one-to-many)
- Each Loo7 belongs to one Student

---

## 5. External API Integration

### 5.1 Quran API Requirements
The application needs a free Quran API that provides:
- **Surah Information**: List of all 114 Surahs with names (Arabic/English) and number of Ayat
- **Aya-by-Aya Data**: Each Aya with:
  - Surah number and name
  - Aya number (within the Surah)
  - Arabic text
  - Optional: Translation

### 5.2 Recommended APIs
- **Al-Quran Cloud API** (https://alquran.cloud/api)
- **Quran.com API** (https://api.quran.com/api/v4)
- **Tanzil.net API**

### 5.3 API Usage Scenarios
1. **Creating Loo7**: Load Surah list and Aya count for selection
2. **Viewing Loo7 Text**: Fetch specific Aya range for display
3. **Validation**: Verify Aya numbers exist in selected Surah

---

## 6. User Interface Requirements

### 6.1 Main Navigation
- Dashboard (Today's Students)
- Students Management
- Create Loo7
- Calendar View (optional)
- Reports (optional)

### 6.2 Key Screens

#### 6.2.1 Dashboard
- **Purpose**: Show today's schedule
- **Content**:
  - Date selector (default: today)
  - List of students with loo7 for selected date
  - Quick stats (total students, pending/completed loo7)
- **Actions**: Click student to view their loo7

#### 6.2.2 Students Management
- **Purpose**: CRUD operations for students
- **Content**:
  - Searchable/sortable student list
  - Student cards with basic info
- **Actions**: Add, Edit, Delete, Create Loo7

#### 6.2.3 Create Loo7
- **Purpose**: Assign new manuscript to student
- **Content**:
  - Student selection dropdown
  - Loo7 type selection (radio buttons/dropdown)
  - Date picker (default: tomorrow)
  - Surah selection dropdown
  - Aya range selection (start/end numbers)
  - Preview of selected Ayat (optional)
- **Actions**: Save, Cancel, Add Another

#### 6.2.4 Student Daily View
- **Purpose**: View and evaluate student's daily loo7
- **Content**:
  - Student name and date
  - List of 1-3 loo7 cards showing:
    - Type badge
    - Surah name
    - Aya range
    - Status (pending/completed)
- **Actions**: Click loo7 to view text and evaluate

#### 6.2.5 Loo7 Evaluation View
- **Purpose**: Display Quran text and record evaluation
- **Content**:
  - Loo7 details (student, type, date)
  - Full Arabic text of assigned Ayat
  - Aya numbers displayed clearly
  - Evaluation form:
    - Score buttons (Excellent, Good, Weak, Repeat)
    - Optional notes field
- **Actions**: Submit evaluation, Cancel

---

## 7. Business Logic & Rules

### 7.1 Loo7 Creation Rules
- A student can have multiple loo7 for the same date
- Typically 3 loo7 per day (one per type)
- Aya range must be within single Surah boundaries
- Cannot create loo7 for past dates (optional validation)

### 7.2 Evaluation Rules
- Each loo7 can only be evaluated once
- "Repeat" score triggers automatic new loo7 creation
- Once evaluated, loo7 status changes to "completed"

### 7.3 Calendar Rules
- Friday typically has no assignments
- Next scheduled day logic should skip Fridays by default

### 7.4 Date Handling
- All dates stored in standard format (ISO 8601)
- Display dates in Arabic/Islamic format
- Time zone considerations for recitation dates

---

## 8. Technical Considerations

### 8.1 Authentication & Security
- Sheikh-only access (login system)
- Secure storage of credentials
- Session management
- No student login required

### 8.2 Data Persistence
- **Options**:
  - Browser localStorage (simple, for single-device use)
  - Cloud database (Firebase, Supabase, etc.)
  - Backend with database (PostgreSQL, MongoDB)
- **Recommendation**: Start with localStorage, migrate to cloud later

### 8.3 Offline Capability
- Consider caching Quran data for offline use
- Queue evaluations when offline, sync when online (optional)

### 8.4 Main styling and design
- The application should be designed to be used on a mobile phone.
- Fully in light mode.
- Fully in Arabic.

---

## 9. Glossary

- **Loo7 (لوح)**: Manuscript/tablet, a portion of Quran to recite
- **Aya (آية)**: Verse of the Quran
- **Surah (سورة)**: Chapter of the Quran
- **Tahfeez (تحفيظ)**: Memorization/recitation
- **Sheikh (شيخ)**: Teacher/instructor

---

## Appendix A: Sample User Workflows

### Workflow 1: Creating Daily Loo7
1. Sheikh logs in
2. Goes to "Create Loo7" page
3. Selects student "Ahmed"
4. Selects type "New"
5. Sets date to tomorrow
6. Selects Surah "Al-Baqarah"
7. Sets Aya range: 10-15
8. Clicks "Save"
9. Repeats for "Near Past" and "Far Past" types
10. Moves to next student

### Workflow 2: Daily Evaluation
1. Sheikh opens Dashboard for today
2. Sees list of 10 students
3. Clicks on student "Fatima"
4. Sees her 3 loo7 for today
5. Clicks on first loo7 (New)
6. Reads displayed Quran text
7. Student recites
8. Sheikh selects "Excellent"
9. Adds note: "Perfect pronunciation"
10. Submits evaluation
11. Repeats for remaining 2 loo7

### Workflow 3: Handling "Repeat" Score
1. Sheikh evaluates student's loo7
2. Selects "Repeat" score
3. System automatically creates new loo7 with:
   - Same student
   - Same type and Aya range
   - Tomorrow's date
4. Sheikh sees confirmation
5. Continues with next loo7

---

*End of Documentation*