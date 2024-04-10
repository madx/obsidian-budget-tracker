# Obsidian Budget Tracker

This is an early release for my budget tracker using [Dataview](https://blacksmithgu.github.io/obsidian-dataview/) in [Obsidian](https://obsidian.md).

I tried documenting it below, but if you want to know more, HMU on the [Obsidian Discord](https://discord.gg/obsidianmd) (nickname is `koleir` there).

## Disclaimer

This budget tracker only works for one (1) account, although you could change it a bit to be able to handle multiple ones. It does not handle retrieving transactions from your bank account nor producing compatible CSV data. I am using external (custom) tools to do this.

## Setup

First, you need to create 4 CSV files:

- `finance-posted.csv` holds transactions that your bank is aware of. Summing these up should lead you to see the same balance that you have on your account.
- `finance-pending.csv` is used to note transactions that you made but are not yet posted on your bank accouunt.
- `finance-scheduled.csv` allows you to list future transactions that you know are going to occur.
- `finance-categories.csv` stores information about your transaction categories.

I put these in a `Stores` folder at the root of my vault, you need to adapt the source code if you want to change these paths.

Then I have a Budget.md note with the following content:

```
---
cssclasses:
  - wide-page
---

# Budget

~~~dataviewjs
await dv.view("Vault/Views/Budget", {container: this.container})
~~~
```

Each CSV file has one line describing the headers.

### Posted transactions

`"id","date","payee","category","amount","note","label"`

- `id`: Unique transaction ID (use the one from your bank)
- `date`: Transaction date in `YYYY-MM-DD` format
- `payee`: Payee name
- `category`: Category name (must match a category in `finances-categories.csv`)
- `amount`: Amount in Cents
- `note`: A custom note about this transaction
- `label`: Transaction label from your bank

### Pending and scheduled

`date,payee,category,amount,note`

- `date`: Transaction date in `YYYY-MM-DD` format
- `payee`: Payee name
- `category`: Category name (must match a category in `finances-categories.csv`)
- `amount`: Amount in Cents
- `note`: A custom note about this transaction

### Categories

`name,color`

- `name`: Category name
- `color`: Category color
