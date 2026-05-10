# Project 1: Console Decision Helper

## Overview

In this project, you will write a Java console program that reads information about **one user** and prints a short personalized summary for that user.

This project is designed to practice:

- variables
- keyboard input with `Scanner`
- arithmetic calculations
- formatted output
- `String` values
- `if / else if / else` branches
- exact output formatting

You do **not** need to create a graphical interface. This is a console program.

---

## File and class name

Submit one Java file:

```text
DecisionHelper.java
```

Your public class must be named:

```java
public class DecisionHelper
```

Your program must contain a `main()` method.

---

## Program behavior

Your program will read **one user record** from standard input.

The user record contains four values:

```text
name age weeklyExerciseMinutes monthlyBudget
```

After reading the four values, the program should calculate the required information and print the required output once.

The program should not use a loop.

---

## Input format

The input has this format:

```text
name age weeklyExerciseMinutes monthlyBudget
```

### Input value descriptions

`name`

The user’s name.

The name will be one word only.

Examples:

```text
Ava
Ben
Maria
```

`age`

The user’s age as an integer.

Examples:

```text
17
25
70
```

`weeklyExerciseMinutes`

The number of minutes the user exercises in one week.

This will be an integer.

Examples:

```text
45
120
180
```

`monthlyBudget`

The amount of money the user has available for one month.

This will be a decimal number.

Examples:

```text
300
450.00
725.50
```

---

## Example input

```text
Ava 19 180 450
```

The program should process Ava and then stop.

---

## Required calculations and classifications

For the user, your program must determine:

1. the age group
2. the exercise category
3. the daily budget
4. one recommendation sentence

---

## Age group rules

Use the user’s age to determine the age group.

Use these exact category names:

```text
minor
adult
senior
```

Rules:

```text
age less than 18          -> minor
age from 18 through 64    -> adult
age 65 or older           -> senior
```

Boundary examples:

```text
17 -> minor
18 -> adult
64 -> adult
65 -> senior
```

---

## Exercise category rules

Use the user’s weekly exercise minutes to determine the exercise category.

Use these exact category names:

```text
low exercise
moderate exercise
high exercise
```

Rules:

```text
less than 75 minutes       -> low exercise
75 through 149 minutes     -> moderate exercise
150 minutes or more        -> high exercise
```

Boundary examples:

```text
74  -> low exercise
75  -> moderate exercise
149 -> moderate exercise
150 -> high exercise
```

---

## Daily budget calculation

Calculate the user’s daily budget using:

```text
dailyBudget = monthlyBudget / 30.0
```

The daily budget must be printed with exactly two digits after the decimal point.

For example:

```text
monthlyBudget = 450
dailyBudget = 15.00
```

---

## Recommendation rules

Your program must print one recommendation sentence for the user.

The recommendation should be based on the exercise category.

Use these exact sentences:

For `low exercise`:

```text
Recommendation: start with a small weekly goal.
```

For `moderate exercise`:

```text
Recommendation: keep building consistency.
```

For `high exercise`:

```text
Recommendation: maintain healthy habits.
```

---

## Required output format

Print exactly two lines.

Line 1 format:

```text
name: ageGroup, exerciseCategory, daily budget $dailyBudget
```

Line 2 format:

```text
Recommendation: recommendation sentence
```

Do not print extra prompts.

Do not print:

```text
Enter name:
Enter age:
```

The output must only contain the required result lines.

---

## Sample input 1

```text
Ava 19 180 450
```

## Sample output 1

```text
Ava: adult, high exercise, daily budget $15.00
Recommendation: maintain healthy habits.
```

---

## Sample input 2

```text
Liam 17 75 150
```

## Sample output 2

```text
Liam: minor, moderate exercise, daily budget $5.00
Recommendation: keep building consistency.
```

---

## Sample input 3

```text
Noah 65 150 900
```

## Sample output 3

```text
Noah: senior, high exercise, daily budget $30.00
Recommendation: maintain healthy habits.
```

---

## Required programming features

Your program must use:

- `Scanner` for input
- variables with appropriate data types
- arithmetic expressions
- `if / else if / else` branches
- `System.out.printf()` for the daily budget
- at least one meaningful comment

Your program does **not** need to use a loop.

---

## Suggested program structure

Your program should follow this general structure:

```text
create Scanner

read name
read age
read weeklyExerciseMinutes
read monthlyBudget

determine age group
determine exercise category
calculate daily budget
determine recommendation

print summary line
print recommendation line
```

---

## Important output notes

The output is graded exactly.

This means spacing, spelling, punctuation, capitalization, and decimal formatting matter.

Make sure your output uses:

```text
adult
minor
senior
low exercise
moderate exercise
high exercise
daily budget $
Recommendation:
```

Use exactly two digits after the decimal point for money.

Correct:

```text
daily budget $15.00
```

Incorrect:

```text
daily budget $15
daily budget $15.0
Daily Budget $15.00
daily budget: $15.00
```

---

## Restrictions

Do not use loops.

Do not use arrays.

Do not use custom methods.

Do not use classes other than `DecisionHelper`.

Do not use file input.

Do not print extra prompts.

Do not ask the user questions.

Do not hard-code the sample output.

Your program must work for different valid inputs, not only the sample input.

---

## Grading rubric

Total: 100 points

### Input parsing: 15 points

The program correctly reads the name.

The program correctly reads age, exercise minutes, and monthly budget.

The program reads exactly one user record.

The program uses the correct data types for each input value.

### Calculations and logic: 30 points

The program correctly calculates daily budget.

The program correctly determines age group.

The program correctly determines exercise category.

The program correctly selects the recommendation sentence.

Boundary cases are handled correctly.

### Required design: 20 points

The program uses branch statements correctly.

The program uses appropriate variable types.

The program is organized clearly.

The program avoids unnecessary repeated code.

The program does not use a loop.

### Output format: 20 points

The output format matches the required format.

The daily budget is formatted to two decimal places.

There are no extra prompts.

There are no extra labels.

Spelling and capitalization match the examples.

### Edge cases: 10 points

The program handles minor/adult/senior boundaries.

The program handles exercise category boundaries.

The program handles decimal monthly budgets.

### Style: 5 points

The code is readable.

Variable names are meaningful.

Indentation is consistent.

The program includes at least one useful comment.