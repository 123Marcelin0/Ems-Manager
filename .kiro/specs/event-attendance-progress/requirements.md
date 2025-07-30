# Requirements Document

## Introduction

This feature enhances the event details page to display accurate employee attendance progress by showing the number of available employees versus the required number of employees for each event. The progress bar should reflect real-time employee availability status from the Mitteilungen (Messages) page and synchronize correctly with event requirements.

## Requirements

### Requirement 1

**User Story:** As an event manager, I want to see the current number of available employees for an event, so that I can track recruitment progress accurately.

#### Acceptance Criteria

1. WHEN viewing an event details page THEN the progress bar SHALL display the count of employees with "available" status
2. WHEN an employee changes their status on the Mitteilungen page THEN the event details progress bar SHALL update in real-time
3. WHEN multiple events are displayed THEN each event SHALL show its specific availability count

### Requirement 2

**User Story:** As an event manager, I want to see the required number of employees for each event, so that I can understand the staffing target.

#### Acceptance Criteria

1. WHEN viewing an event details page THEN the progress bar SHALL display the total required employees for that specific event
2. WHEN the required employee count is modified THEN the progress bar SHALL update to reflect the new target
3. WHEN calculating progress THEN the system SHALL use the format "available/required" (e.g., "1/5")

### Requirement 3

**User Story:** As an event manager, I want the progress bar to visually represent completion percentage, so that I can quickly assess staffing status.

#### Acceptance Criteria

1. WHEN displaying the progress bar THEN it SHALL show the percentage as (available employees / required employees) * 100
2. WHEN the event is fully staffed THEN the progress bar SHALL show 100% completion
3. WHEN the event is overstaffed THEN the progress bar SHALL cap at 100% but show the actual numbers

### Requirement 4

**User Story:** As an event manager, I want the employee availability data to synchronize across all views, so that information is consistent throughout the application.

#### Acceptance Criteria

1. WHEN an employee updates their status THEN all event views SHALL reflect the change within 2 seconds
2. WHEN viewing the Mitteilungen page THEN employee statuses SHALL match those shown in event details
3. WHEN multiple users are viewing the same event THEN they SHALL see synchronized availability counts

### Requirement 5

**User Story:** As an event manager, I want to see work area specific availability, so that I can track staffing for different roles within an event.

#### Acceptance Criteria

1. WHEN an event has multiple work areas THEN each work area SHALL show its own availability count
2. WHEN displaying work area progress THEN the format SHALL be "available/required" per work area
3. WHEN calculating overall event progress THEN it SHALL aggregate all work area requirements