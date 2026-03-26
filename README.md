# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

```
budget-buddy
├─ bun.lockbbak
├─ components.json
├─ eslint.config.js
├─ functions
│  └─ api
│     └─ proxy.js
├─ index.html
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ public
│  ├─ apple-touch.png
│  ├─ favicon.ico
│  ├─ favicon.png
│  ├─ logo.png
│  ├─ placeholder.svg
│  └─ robots.txt
├─ README.md
├─ src
│  ├─ App.css
│  ├─ App.tsx
│  ├─ components
│  │  ├─ BudgetCard.tsx
│  │  ├─ ChangePinModal.tsx
│  │  ├─ CurrencyInput.tsx
│  │  ├─ LM
│  │  │  ├─ DashboardCard.tsx
│  │  │  ├─ GoalDetailCard.tsx
│  │  │  ├─ GoalsCard.tsx
│  │  │  └─ NewGoalModal.tsx
│  │  ├─ LockScreen.tsx
│  │  ├─ NavLink.tsx
│  │  ├─ NewBudgetModal.tsx
│  │  ├─ Receiptscanner.tsx
│  │  ├─ SummaryCards.tsx
│  │  └─ ui
│  │     ├─ accordion.tsx
│  │     ├─ alert-dialog.tsx
│  │     ├─ alert.tsx
│  │     ├─ aspect-ratio.tsx
│  │     ├─ avatar.tsx
│  │     ├─ badge.tsx
│  │     ├─ breadcrumb.tsx
│  │     ├─ button.tsx
│  │     ├─ calendar.tsx
│  │     ├─ card.tsx
│  │     ├─ carousel.tsx
│  │     ├─ chart.tsx
│  │     ├─ checkbox.tsx
│  │     ├─ collapsible.tsx
│  │     ├─ command.tsx
│  │     ├─ context-menu.tsx
│  │     ├─ dialog.tsx
│  │     ├─ drawer.tsx
│  │     ├─ dropdown-menu.tsx
│  │     ├─ form.tsx
│  │     ├─ hover-card.tsx
│  │     ├─ input-otp.tsx
│  │     ├─ input.tsx
│  │     ├─ label.tsx
│  │     ├─ menubar.tsx
│  │     ├─ navigation-menu.tsx
│  │     ├─ pagination.tsx
│  │     ├─ popover.tsx
│  │     ├─ progress.tsx
│  │     ├─ radio-group.tsx
│  │     ├─ resizable.tsx
│  │     ├─ scroll-area.tsx
│  │     ├─ select.tsx
│  │     ├─ separator.tsx
│  │     ├─ sheet.tsx
│  │     ├─ sidebar.tsx
│  │     ├─ skeleton.tsx
│  │     ├─ slider.tsx
│  │     ├─ sonner.tsx
│  │     ├─ switch.tsx
│  │     ├─ table.tsx
│  │     ├─ tabs.tsx
│  │     ├─ textarea.tsx
│  │     ├─ toast.tsx
│  │     ├─ toaster.tsx
│  │     ├─ toggle-group.tsx
│  │     ├─ toggle.tsx
│  │     ├─ tooltip.tsx
│  │     └─ use-toast.ts
│  ├─ context
│  │  ├─ BudgetContext.tsx
│  │  └─ UserContext.tsx
│  ├─ env.development
│  ├─ env.production
│  ├─ hooks
│  │  ├─ use-mobile.tsx
│  │  ├─ use-toast.ts
│  │  ├─ useBudgetData.ts
│  │  └─ useBudgetData.tsbak
│  ├─ index.css
│  ├─ lib
│  │  ├─ firebase.ts
│  │  ├─ firebase_lm.ts
│  │  └─ utils.ts
│  ├─ main.tsx
│  ├─ pages
│  │  ├─ AuthGuard.tsx
│  │  ├─ BudgetDetail
│  │  │  ├─ BudgetDetail.tsx
│  │  │  ├─ BudgetOverview.tsx
│  │  │  ├─ DataGrid.tsx
│  │  │  ├─ DoodlePieChart.tsx
│  │  │  ├─ flagUtils.ts
│  │  │  ├─ PersonCombobox.tsx
│  │  │  └─ TransactionHistory.tsx
│  │  ├─ BudgetDetail.tsxbak
│  │  ├─ Index.tsx
│  │  ├─ LM
│  │  │  ├─ GoalDetail.tsx
│  │  │  └─ Market.tsx
│  │  └─ NotFound.tsx
│  ├─ services
│  │  ├─ db.ts
│  │  └─ goldApi.ts
│  ├─ test
│  │  ├─ example.test.ts
│  │  └─ setup.ts
│  ├─ types
│  │  ├─ budget.ts
│  │  └─ goals.ts
│  └─ vite-env.d.ts
├─ tailwind.config.ts
├─ tsconfig.app.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ vite.config.ts
├─ vitest.config.ts
└─ wrangler.jsonc

```