# Requirements Document

## Introduction

This document outlines the requirements for implementing a comprehensive Supabase backend for the Employee Management System (EMS). The system manages the complete lifecycle of event-based employee scheduling, from event creation through WhatsApp-based employee recruitment, availability tracking, work assignment, and time tracking. The system ensures fair work distribution by prioritizing employees who haven't worked recently while maintaining fixed employee assignments.

## Requirements

### Requirement 1: Employee Management and Work History Tracking

**User Story:** As a manager, I want to manage employee profiles with work history tracking, so that I can ensure fair work distribution by prioritizing employees who haven't worked recently.

#### Acceptance Criteria

1. WHEN an employee is created THEN the system SHALL store employee profile with unique ID, name, user ID, phone number, role, skills, and employment type (part-time/fixed)
2. WHEN an employee works an event THEN the system SHALL update their last_worked_date and total_hours_worked automatically
3. WHEN querying employees for selection THEN the system SHALL sort by last_worked_date ascending to prioritize those who haven't worked longest
4. WHEN an employee is marked as "always-needed" THEN the system SHALL flag them as fixed employees who get asked for every event
5. IF an employee has no work history THEN the system SHALL treat them as highest priority for selection

### Requirement 2: Event Creation and Planning

**User Story:** As a manager, I want to create events with detailed requirements and work areas, so that I can plan staffing needs and define where employees will work.

#### Acceptance Criteria

1. WHEN creating an event THEN the system SHALL store event details including title, location, date/time, description, hourly rate, employees needed, and employees to ask
2. WHEN defining work areas for an event THEN the system SHALL allow specification of location, capacity, and role requirements per work area
3. WHEN event is created THEN the system SHALL set initial status as "draft" until planning is complete
4. WHEN work areas are configured THEN the system SHALL validate that total work area capacity matches employees needed
5. IF employees needed is specified THEN the system SHALL automatically calculate employees to ask with configurable buffer percentage

### Requirement 3: WhatsApp Integration and Employee Recruitment

**User Story:** As a manager, I want to send WhatsApp messages to selected employees asking about availability, so that I can efficiently recruit staff for events through their preferred communication channel.

#### Acceptance Criteria

1. WHEN selecting employees to ask THEN the system SHALL prioritize employees who haven't worked longest, plus all "always-needed" employees
2. WHEN sending WhatsApp invitations THEN the system SHALL use Twilio API to send personalized messages with event details
3. WHEN employee responds "yes" THEN the system SHALL mark them as "available" for that specific event
4. WHEN employee responds "no" THEN the system SHALL mark them as "unavailable" for that specific event
5. IF insufficient employees accept THEN the system SHALL automatically trigger additional recruitment rounds with configurable percentage increase

### Requirement 4: Event-Specific Employee Status Management

**User Story:** As a manager, I want to track employee availability per event separately, so that I can manage different events independently without status conflicts.

#### Acceptance Criteria

1. WHEN tracking employee status THEN the system SHALL maintain separate status per event (available, unavailable, selected, not-asked)
2. WHEN employee accepts invitation THEN the system SHALL update status only for that specific event
3. WHEN event requires more employees THEN the system SHALL automatically ask additional employees based on fair distribution algorithm
4. WHEN sufficient employees are recruited THEN the system SHALL mark event as "ready" and stop recruitment
5. IF employee status changes after acceptance THEN the system SHALL notify manager and suggest replacements

### Requirement 5: Automatic Work Assignment and Status Updates

**User Story:** As a manager, I want employees to be automatically marked as working when their event starts, so that I can track active work sessions without manual intervention.

#### Acceptance Criteria

1. WHEN event start time arrives THEN the system SHALL automatically mark all "available" employees as "working" status
2. WHEN employees are marked as working THEN the system SHALL create sign-out records with start time and location
3. WHEN event is active THEN the system SHALL show all working employees in the sign-out table
4. WHEN employee needs to leave early THEN the system SHALL allow manual sign-out with actual end time
5. IF event ends THEN the system SHALL prompt manager to sign out remaining employees

### Requirement 6: Time Tracking and Hours Calculation

**User Story:** As a manager, I want to track actual work hours and calculate payments, so that I can maintain accurate payroll records and employee work history.

#### Acceptance Criteria

1. WHEN employee signs out THEN the system SHALL calculate total work hours based on sign-in and sign-out times
2. WHEN work hours are calculated THEN the system SHALL multiply by event hourly rate to determine payment amount
3. WHEN work session ends THEN the system SHALL update employee's total work hours and last worked date
4. WHEN viewing employee overview THEN the system SHALL show work history with hours and payments per event
5. IF work hours need adjustment THEN the system SHALL allow manual editing with audit trail

### Requirement 7: Event Lifecycle and Status Management

**User Story:** As a manager, I want to track events through their complete lifecycle, so that I can monitor progress and ensure proper completion of all phases.

#### Acceptance Criteria

1. WHEN event is created THEN the system SHALL set status as "draft" until work areas are configured
2. WHEN recruitment is complete THEN the system SHALL set status as "planned" and show in all views
3. WHEN event day arrives THEN the system SHALL set status as "active" and enable time tracking
4. WHEN all employees sign out THEN the system SHALL set status as "completed" and finalize records
5. IF event is cancelled THEN the system SHALL set status as "cancelled" and notify all recruited employees

### Requirement 8: Fair Distribution Algorithm

**User Story:** As a manager, I want an automated system that ensures fair work distribution, so that all part-time employees get equal opportunities while maintaining fixed employee assignments.

#### Acceptance Criteria

1. WHEN selecting employees for recruitment THEN the system SHALL use algorithm that prioritizes employees with oldest last_worked_date
2. WHEN "always-needed" employees exist THEN the system SHALL include them in every event recruitment regardless of last worked date
3. WHEN calculating employees to ask THEN the system SHALL exclude "always-needed" count from fair distribution pool
4. WHEN additional employees are needed THEN the system SHALL continue fair distribution algorithm for next batch
5. IF no work history exists THEN the system SHALL treat employee as highest priority (never worked)

### Requirement 9: Real-Time Status Updates and Notifications

**User Story:** As a manager, I want real-time updates on employee responses and event status, so that I can monitor recruitment progress and make timely decisions.

#### Acceptance Criteria

1. WHEN employee responds to WhatsApp invitation THEN the system SHALL update status in real-time across all connected clients
2. WHEN recruitment targets are met THEN the system SHALL notify manager and stop sending additional invitations
3. WHEN employee status changes THEN the system SHALL broadcast updates to dashboard and relevant views
4. WHEN event becomes ready THEN the system SHALL show "planned" status across all views immediately
5. IF recruitment is falling short THEN the system SHALL alert manager and suggest increasing ask count

### Requirement 10: Data Persistence and Audit Trail

**User Story:** As a system administrator, I want complete audit trails and data persistence, so that I can maintain accurate records and troubleshoot issues.

#### Acceptance Criteria

1. WHEN any employee status changes THEN the system SHALL log change with timestamp, event, and reason
2. WHEN work hours are recorded THEN the system SHALL maintain immutable records with edit history
3. WHEN WhatsApp messages are sent THEN the system SHALL log message content, recipient, and delivery status
4. WHEN events are completed THEN the system SHALL archive all related data while keeping it accessible
5. IF data inconsistencies occur THEN the system SHALL provide tools to identify and resolve conflicts