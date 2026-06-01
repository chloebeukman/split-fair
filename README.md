# Split Fair
#### Video Demo: <[URL HERE](https://youtu.be/XhXqkSy7Oqo?si=b8x6Ej6uCVsGd6tW)>
#### Description:

## What is Split Fair?

Split Fair is a mobile bill-splitting app built with React Native and Expo. 
It allows groups of people to split expenses fairly — whether equally or by 
individual items — and calculates exactly who owes who at the end, with the 
minimum number of transactions needed to settle up.

## Why I Built It

Whenever my friends and I go out to a restaurant or travel together, we always 
end up with the same problems: one person pays too much, someone forgets to tip, 
and nobody can agree on who owes what. Mental math at the dinner table is 
stressful and awkward. Split Fair solves this quickly and easily — no complicated 
sums, no arguments, just a clear answer.

I wanted to build something I would actually use, and this was it.

## Features

- Add people to a group, each assigned a unique colour
- Create expenses with multiple line items
- Split each item between specific people — not everyone orders the same thing
- Add a tip (10%, 15%, 20%, or custom percentage)
- Select who paid for the expense
- View a full expense history with breakdowns
- See individual balances on the home screen
- Calculate the minimum transactions needed to settle all debts
- Select which person in the group is you, so the app shows your personal balance
- Choose your preferred currency (ZAR, USD, EUR, GBP)
- All data persists between sessions using AsyncStorage

## Why React Native?

I specifically chose React Native with Expo because I wanted a mobile app, not 
a web app. The real-world use case for Split Fair is at a restaurant table or 
while travelling abroad — situations where you need your phone, not a laptop. 
The app needed to feel native and be accessible in the moment, which made mobile 
the only sensible choice.

## Project Structure

### `context/AppContext.tsx`
This is the most important file in the project. It contains all the data types, 
the global state, and the core logic of the app. It defines the `Person`, 
`Expense`, `ExpenseItem`, and `Settlement` types. It also contains two key 
functions: `calculateBalances`, which works out each person's net balance across 
all expenses, and `calculateSettlements`, which uses a greedy algorithm to 
determine the minimum number of payments needed to settle all debts. All data 
is persisted to the device using AsyncStorage, so nothing is lost when the app 
is closed.

### `app/_layout.tsx`
The root layout that wraps the entire app in the `AppProvider` context, making 
all data and functions available to every screen.

### `app/index.tsx`
A simple redirect that sends the user from the root route to the Home tab.

### `app/(tabs)/_layout.tsx`
Defines the bottom tab navigation with five tabs: Home, Expenses, People, 
Settle, and Settings. Uses Expo Router's file-based routing system.

### `app/(tabs)/home.tsx`
The main dashboard. Shows the current user's personal balance (how much they 
owe or are owed), a full list of balances for everyone in the group, and a list 
of recent expenses. Contains the floating action button to add a new expense.

### `app/(tabs)/expenses.tsx`
A full history of all expenses, shown in reverse chronological order. Each 
expense card shows the line items, which people each item was split between, 
the tip, and the total. Expenses can be deleted from this screen.

### `app/(tabs)/people.tsx`
Manages the group members. People can be added by name and removed with a 
confirmation prompt. Each person is automatically assigned a colour from a 
preset palette, which is used consistently across all screens.

### `app/(tabs)/settle.tsx`
Shows the settlement plan — who needs to pay who, and how much. Uses the 
minimum transactions algorithm from AppContext to simplify the payments as much 
as possible. Also shows each person's individual balance with a status label.

### `app/(tabs)/settings.tsx`
Allows the user to select which person in the group represents them, so the 
Home screen can show their personal balance correctly. Also contains the 
currency selector.

### `app/expense/new.tsx`
The most complex screen in the app. Allows the user to create a new expense 
with a title, multiple line items, per-item splitting between specific people, 
a tip selector with presets and a custom option, and a "paid by" selector.

## Design Decisions

**Per-item splitting instead of a single total:** In real situations, not 
everyone orders the same thing. One person might have a starter, another might 
skip dessert. Splitting a single total equally ignores this reality. By 
splitting per item, Split Fair handles the way people actually share expenses.

**Minimum transactions algorithm:** Rather than showing a simple list of who 
owes who for each expense, Split Fair calculates the most efficient way to 
settle everything at once. This means fewer bank transfers and less hassle.

**Session-based data with AsyncStorage:** Rather than building a full backend 
and login system for v1, data is stored locally on the device. This keeps the 
app fast, simple, and usable without an internet connection — important when 
travelling abroad.

**Currency display without conversion:** The currency selector changes the 
symbol displayed but does not convert amounts. This was a deliberate decision 
for v1 — conversion requires a live exchange rate API and adds complexity. The 
primary use case is a single currency per session.

## Challenges

The biggest challenge was setting up the Expo development environment on 
Windows. Dependency conflicts between Node, Expo, and React Native caused 
significant issues that required debugging before a single line of app code 
could be written. This was also my first major project with multiple components 
that affect each other — managing shared state across screens was a new 
challenge that the Context API helped solve cleanly.

## What's Next (v2)

- Receipt scanner using an OCR API, so users can photograph a bill and have 
  it auto-filled
- User login and cloud database, so data syncs across devices
- Group system, allowing users to manage multiple groups for different trips 
  or friend groups
- Live currency conversion for use when travelling abroad

## Technologies Used

- React Native
- Expo / Expo Router
- TypeScript
- AsyncStorage
- JavaScript
