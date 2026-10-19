/*
  Python Quest: all lesson and level content.

  Level types
    output  Pick what the code prints (or which error it raises).
            { q, code[], options[], answer, hints[2], why }
    fill    Tap the right word into each ____ blank.
            { q, code[], goal, choices[], answers[], hints[2], why }
    bug     Tap the buggy line, then pick the line that fixes it.
            { q, code[], goal, bug, fixes[], fix, hints[2], why }
    order   Put shuffled lines in the right order.
            { q, goal, lines[], hints[2], why }

  `goal` is the text the finished program must print.
  tools/verify_levels.py runs every level with real Python to prove
  that each answer is correct and that no wrong option also works.
*/
window.PQ_ISLANDS = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: "print-beach",
    emoji: "🏝️",
    name: "Print Beach",
    blurb: "Show messages on the screen with print().",
    learn: {
      points: [
        "print() shows something on the screen.",
        "Text goes inside quote marks, like \"Hello\". Python calls text a string.",
        "A line that starts with # is a comment. Python skips it, so you can leave notes for people.",
        "Python runs your lines from top to bottom, one after the other."
      ],
      code: [
        `print("Hello, Python!")`,
        `# This note is ignored`,
        `print("Bye")`
      ],
      output: "Hello, Python!\nBye"
    },
    levels: [
      {
        type: "output",
        q: "What will this program print?",
        code: [`print("Hello")`],
        options: [`Hello`, `"Hello"`, `print("Hello")`, `Nothing`],
        answer: 0,
        hints: [
          "Look at what is inside print( ... ).",
          "The quote marks only tell Python where the text starts and ends. They are not part of the text."
        ],
        why: "print() shows the text inside the quotes. The quote marks themselves are not printed."
      },
      {
        type: "fill",
        q: "Fill the blank so the program shows the message.",
        code: [`____("Welcome to Python")`],
        goal: "Welcome to Python",
        choices: ["print", "echo", "show", "write"],
        answers: ["print"],
        hints: [
          "Which word from the lesson shows something on the screen?",
          "It starts with the letter p."
        ],
        why: "print() is the function that shows text on the screen. Python has no echo, show or write for this."
      },
      {
        type: "output",
        q: "What will this program print?",
        code: [`# print("Hidden")`, `print("Visible")`],
        options: [`Hidden`, `Visible`, `Hidden\nVisible`, `Nothing is printed`],
        answer: 1,
        hints: [
          "Look at how the first line starts.",
          "A line that starts with # is a comment, so Python skips it."
        ],
        why: "The first line is a comment because it starts with #. Python ignores it, so only print(\"Visible\") runs."
      },
      {
        type: "bug",
        q: "One line has a mistake. Tap that line, then pick the fix.",
        code: [
          `print("Good morning")`,
          `print("Welcome back)`,
          `print("Let's learn")`
        ],
        goal: "Good morning\nWelcome back\nLet's learn",
        bug: 1,
        fixes: [
          `print("Welcome back")`,
          `print("Welcome back"`,
          `print(Welcome back)`,
          `print "Welcome back"`
        ],
        fix: 0,
        hints: [
          "Compare the quote marks on each line. Every opening quote needs a closing quote.",
          "Line 2 opens a quote but never closes it before the bracket."
        ],
        why: "Text must start and end with the same kind of quote, and print( needs its closing bracket. Line 2 was missing the closing quote."
      },
      {
        type: "order",
        q: "Put the lines in the right order to get the goal output.",
        goal: "Ready\nSet\nGo!",
        lines: [`print("Ready")`, `print("Set")`, `print("Go!")`],
        hints: [
          "Python runs the lines from top to bottom.",
          "The first line printed in the goal is Ready."
        ],
        why: "Python runs code from top to bottom, so the order of the lines is the order of the output."
      }
    ]
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: "variable-village",
    emoji: "🏡",
    name: "Variable Village",
    blurb: "Store values in named boxes called variables.",
    learn: {
      points: [
        "A variable is a name that holds a value: age = 15.",
        "The single = sign means \"store this value\". It is not the equals of maths.",
        "You can use the name later, and you can change the value: score = score + 1.",
        "Numbers can use + - * / for maths. Strings can be joined with +.",
        "Variable names are case sensitive: name and Name are two different names."
      ],
      code: [
        `name = "Asha"`,
        `age = 15`,
        `print(name)`,
        `print(age + 1)`
      ],
      output: "Asha\n16"
    },
    levels: [
      {
        type: "output",
        q: "What will this program print?",
        code: [`x = 5`, `print(x)`],
        options: [`5`, `x`, `x = 5`, `Error`],
        answer: 0,
        hints: [
          "The variable x holds a value. print(x) shows that value.",
          "x was set to 5 on the first line."
        ],
        why: "x = 5 stores 5 in x. print(x) looks up x and shows its value, 5, not the letter x."
      },
      {
        type: "fill",
        q: "Fill the blank so the score goes up by 5.",
        code: [`score = 10`, `score = score ____ 5`, `print(score)`],
        goal: "15",
        choices: ["+", "-", "*", "/"],
        answers: ["+"],
        hints: [
          "The goal is 15 and the score started at 10.",
          "Which sign adds numbers together?"
        ],
        why: "score + 5 is 10 + 5 = 15, and then the result is stored back into score."
      },
      {
        type: "output",
        q: "What will this program print?",
        code: [`a = 4`, `b = 3`, `print(a * b)`],
        options: [`7`, `12`, `43`, `a * b`],
        answer: 1,
        hints: [
          "Replace a and b with their values first.",
          "The * sign means multiply."
        ],
        why: "a * b is 4 * 3, which is 12. Python does the maths and prints the result."
      },
      {
        type: "output",
        q: "What will this program print?",
        code: [`first = "Py"`, `second = "thon"`, `print(first + second)`],
        options: [`Python`, `Py thon`, `Py+thon`, `Error`],
        answer: 0,
        hints: [
          "With strings, + joins the text together.",
          "Joining does not add a space by itself."
        ],
        why: "+ between two strings glues them together with nothing in between: \"Py\" + \"thon\" is \"Python\"."
      },
      {
        type: "bug",
        q: "One line has a mistake. Tap that line, then pick the fix.",
        code: [
          `price = 20`,
          `quantity = 3`,
          `total = price x quantity`,
          `print(total)`
        ],
        goal: "60",
        bug: 2,
        fixes: [
          `total = price * quantity`,
          `total = price + quantity`,
          `total = price quantity`,
          `total == price * quantity`
        ],
        fix: 0,
        hints: [
          "Python does not know the letter x as a maths sign.",
          "Which sign multiplies? Also remember that one = stores a value."
        ],
        why: "Multiplication is written with *. Adding would give 23, and == only compares, so it would not store anything in total."
      }
    ]
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: "if-else-forest",
    emoji: "🌲",
    name: "If-Else Forest",
    blurb: "Make the program choose with conditions.",
    learn: {
      points: [
        "A condition is a question with a True or False answer, like age >= 18.",
        "Comparison signs: == equal, != not equal, < less, > greater, <= and >=. Remember that = stores a value and == compares.",
        "if runs the indented lines only when the condition is True. else runs when it is not. elif checks one more condition in between.",
        "The if line ends with a colon, and the lines under it are indented by 4 spaces.",
        "and needs both sides True, or needs at least one, not flips True and False.",
        "% gives the remainder after division: 7 % 2 is 1, and 10 % 2 is 0."
      ],
      code: [
        `temperature = 32`,
        `if temperature > 30:`,
        `    print("Hot")`,
        `else:`,
        `    print("Pleasant")`
      ],
      output: "Hot"
    },
    levels: [
      {
        type: "output",
        q: "What will this program print?",
        code: [
          `x = 7`,
          `if x > 5:`,
          `    print("big")`,
          `else:`,
          `    print("small")`
        ],
        options: [`big`, `small`, `big\nsmall`, `Nothing is printed`],
        answer: 0,
        hints: [
          "First find out if x > 5 is True or False.",
          "x is 7, and 7 is greater than 5."
        ],
        why: "7 > 5 is True, so the indented line under if runs. The else part is skipped."
      },
      {
        type: "fill",
        q: "People who are 18 or older are adults. Fill the blank.",
        code: [
          `age = 18`,
          `if age ____ 18:`,
          `    print("Adult")`,
          `else:`,
          `    print("Minor")`
        ],
        goal: "Adult",
        choices: [">=", ">", "<", "!="],
        answers: [">="],
        hints: [
          "Someone who is exactly 18 must count as an adult.",
          "Which sign means \"greater than or equal to\"?"
        ],
        why: "age >= 18 is True for 18 and for anything above it. With > the age of exactly 18 would be left out."
      },
      {
        type: "output",
        q: "What will this program print?",
        code: [
          `age = 20`,
          `has_ticket = False`,
          `if age >= 18 and has_ticket:`,
          `    print("Enter")`,
          `else:`,
          `    print("Stop")`
        ],
        options: [`Enter`, `Stop`, `Enter\nStop`, `Error`],
        answer: 1,
        hints: [
          "and needs both sides to be True.",
          "age >= 18 is True, but has_ticket is False."
        ],
        why: "True and False is False. Because the condition is False, Python runs the else part and prints Stop."
      },
      {
        type: "bug",
        q: "One line has a mistake. Tap that line, then pick the fix.",
        code: [
          `mark = 72`,
          `if mark >= 40`,
          `    print("Pass")`,
          `else:`,
          `    print("Fail")`
        ],
        goal: "Pass",
        bug: 1,
        fixes: [
          `if mark >= 40:`,
          `if mark => 40:`,
          `if (mark >= 40)`,
          `if mark = 40:`
        ],
        fix: 0,
        hints: [
          "Look at the very end of the if line.",
          "Every if line must end with a colon."
        ],
        why: "An if line must end with a colon. => is not a Python sign (it is >=), and a single = would try to store a value instead of comparing."
      },
      {
        type: "order",
        q: "Put the lines in the right order to get the goal output.",
        goal: "Warm",
        lines: [
          `temp = 25`,
          `if temp > 30:`,
          `    print("Hot")`,
          `else:`,
          `    print("Warm")`
        ],
        hints: [
          "A variable must be created before the if line uses it.",
          "else comes after the lines of the if block."
        ],
        why: "temp must exist before it is checked. The if block comes first, then else, each with its own indented line."
      }
    ]
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: "loop-lagoon",
    emoji: "🌊",
    name: "Loop Lagoon",
    blurb: "Repeat work without writing it again and again.",
    learn: {
      points: [
        "A loop repeats code, so you do not have to write the same line many times.",
        "for i in range(3) repeats 3 times with i = 0, 1, 2. range starts at 0 and stops before the number.",
        "range(1, 4) gives 1, 2, 3. The start is included and the end is not.",
        "for item in my_list goes through a list one item at a time.",
        "while repeats as long as its condition is True. Change something inside the loop, or it never stops."
      ],
      code: [
        `for i in range(3):`,
        `    print(i)`
      ],
      output: "0\n1\n2"
    },
    levels: [
      {
        type: "output",
        q: "What will this program print?",
        code: [`for i in range(3):`, `    print(i)`],
        options: [`1\n2\n3`, `0\n1\n2`, `0\n1\n2\n3`, `3`],
        answer: 1,
        hints: [
          "range(3) starts counting at 0.",
          "range(3) stops before 3, so it gives three numbers: 0, 1 and 2."
        ],
        why: "range(3) gives 0, 1, 2. The loop runs the print line once for each of them."
      },
      {
        type: "fill",
        q: "Fill the blank so the loop prints 1 to 5.",
        code: [`for i in range(1, ____):`, `    print(i)`],
        goal: "1\n2\n3\n4\n5",
        choices: ["6", "5", "4", "1"],
        answers: ["6"],
        hints: [
          "The end number of range() is never included.",
          "To reach 5, the end must be one more than 5."
        ],
        why: "range(1, 6) gives 1, 2, 3, 4, 5. The end value 6 is where it stops, and 6 itself is not included."
      },
      {
        type: "output",
        q: "What will this program print?",
        code: [
          `total = 0`,
          `for n in range(1, 4):`,
          `    total = total + n`,
          `print(total)`
        ],
        options: [`3`, `6`, `10`, `4`],
        answer: 1,
        hints: [
          "First find which numbers n takes: range(1, 4).",
          "total grows by 1, then by 2, then by 3."
        ],
        why: "n is 1, 2, 3. total goes 0 → 1 → 3 → 6. The last print is outside the loop, so it runs once."
      },
      {
        type: "bug",
        q: "This loop never stops. Tap the buggy line, then pick the fix.",
        code: [
          `count = 1`,
          `while count <= 3:`,
          `    print(count)`,
          `    count = count - 1`,
          `print("Done")`
        ],
        goal: "1\n2\n3\nDone",
        bug: 3,
        fixes: [
          `    count = count + 1`,
          `    count = count`,
          `    count = 1`,
          `    count + 1`
        ],
        fix: 0,
        hints: [
          "The loop goes on while count <= 3. What does count do on each round?",
          "count must grow until it passes 3."
        ],
        why: "With count - 1 the number gets smaller and is always <= 3, so the loop never ends. count + 1 moves it towards 4, which stops the loop."
      },
      {
        type: "order",
        q: "Put the lines in the right order to get the goal output.",
        goal: "3\n2\n1\nGo!",
        lines: [
          `count = 3`,
          `while count > 0:`,
          `    print(count)`,
          `    count = count - 1`,
          `print("Go!")`
        ],
        hints: [
          "Create count first, then start the loop.",
          "The indented lines belong inside the loop. Go! is printed once, after it."
        ],
        why: "The loop prints count and then lowers it. When count reaches 0 the condition becomes False, and the last line prints Go!."
      }
    ]
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: "list-cave",
    emoji: "🕳️",
    name: "List Cave",
    blurb: "Keep many values together in lists and dictionaries.",
    learn: {
      points: [
        "A list keeps many values in one place: fruits = [\"apple\", \"banana\", \"cherry\"].",
        "Positions (indexes) start at 0. fruits[0] is the first item, fruits[2] is the third, and fruits[-1] is the last.",
        "len(fruits) tells you how many items there are, here 3.",
        "fruits.append(\"mango\") adds an item at the end.",
        "A dictionary stores pairs of key and value: student = {\"name\": \"Asha\", \"age\": 15}. Use student[\"name\"] to get \"Asha\"."
      ],
      code: [
        `fruits = ["apple", "banana", "cherry"]`,
        `print(fruits[0])`,
        `print(len(fruits))`
      ],
      output: "apple\n3"
    },
    levels: [
      {
        type: "output",
        q: "What will this program print?",
        code: [`colors = ["red", "green", "blue"]`, `print(colors[0])`],
        options: [`red`, `green`, `blue`, `["red", "green", "blue"]`],
        answer: 0,
        hints: [
          "Index numbers in Python start at 0, not 1.",
          "colors[0] is the very first item."
        ],
        why: "Index 0 is the first item of a list, so colors[0] is \"red\"."
      },
      {
        type: "output",
        q: "What will this program print?",
        code: [`nums = [4, 8, 15]`, `print(len(nums))`],
        options: [`15`, `3`, `2`, `8`],
        answer: 1,
        hints: [
          "len() counts items. It does not add them.",
          "How many numbers are inside the square brackets?"
        ],
        why: "len(nums) is the number of items in the list. There are three items, so it is 3."
      },
      {
        type: "fill",
        q: "Fill the blank to add \"bird\" to the end of the list.",
        code: [`animals = ["cat", "dog"]`, `animals.____("bird")`, `print(animals)`],
        goal: "['cat', 'dog', 'bird']",
        choices: ["append", "add", "push", "insert"],
        answers: ["append"],
        hints: [
          "The lesson showed one list method that adds at the end.",
          "It begins with the letter a."
        ],
        why: "append() adds one item at the end of a list. add and push do not exist for lists, and insert needs a position too."
      },
      {
        type: "output",
        q: "What will this program print?",
        code: [`person = {"name": "Ravi", "age": 20}`, `print(person["age"])`],
        options: [`Ravi`, `20`, `age`, `name`],
        answer: 1,
        hints: [
          "In a dictionary you look up a key to get its value.",
          "The key is \"age\". What value is stored next to it?"
        ],
        why: "person[\"age\"] looks up the key \"age\" and gives its value, 20."
      },
      {
        type: "bug",
        q: "This program crashes. Tap the buggy line, then pick the fix.",
        code: [
          `items = ["pen", "book", "bag"]`,
          `last = items[3]`,
          `print(last)`
        ],
        goal: "bag",
        bug: 1,
        fixes: [
          `last = items[2]`,
          `last = items[1]`,
          `last = items[-3]`,
          `last = items(2)`
        ],
        fix: 0,
        hints: [
          "The list has 3 items. Which index numbers exist?",
          "Indexes are 0, 1 and 2. \"bag\" is the third item."
        ],
        why: "With 3 items the indexes are 0, 1 and 2, so items[3] causes an IndexError. items[2] is \"bag\". Round brackets would try to call items like a function."
      }
    ]
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: "function-fort",
    emoji: "🏰",
    name: "Function Fort",
    blurb: "Build your own reusable mini-programs.",
    learn: {
      points: [
        "def creates a function, a reusable mini-program. Its lines are indented.",
        "Nothing inside runs until you call the function by name, like hello().",
        "Parameters are inputs: def double(x). When you call double(4), the value 4 goes into x.",
        "return sends a value back to the caller. print only shows something on the screen.",
        "A function stops at return. Any line after it in the same function never runs."
      ],
      code: [
        `def double(x):`,
        `    return x * 2`,
        ``,
        `print(double(4))`
      ],
      output: "8"
    },
    levels: [
      {
        type: "output",
        q: "What will this program print?",
        code: [
          `def hello():`,
          `    print("Hi!")`,
          ``,
          `hello()`,
          `hello()`
        ],
        options: [`Hi!`, `Hi!\nHi!`, `Nothing is printed`, `hello()\nhello()`],
        answer: 1,
        hints: [
          "def only creates the function. It does not run it.",
          "Count how many times hello() is called."
        ],
        why: "The def lines only define hello. Each call hello() runs it once, so Hi! is printed twice."
      },
      {
        type: "fill",
        q: "Fill the blank so the function gives the doubled number back.",
        code: [
          `def double(x):`,
          `    ____ x * 2`,
          ``,
          `print(double(4))`
        ],
        goal: "8",
        choices: ["return", "print", "def", "give"],
        answers: ["return"],
        hints: [
          "The function must send a value back to the line that called it.",
          "Which word from the lesson sends a value back?"
        ],
        why: "return hands x * 2 back to the caller, so print(double(4)) can show 8. There is no give keyword in Python."
      },
      {
        type: "output",
        q: "What will this program print?",
        code: [
          `def add(a, b):`,
          `    return a + b`,
          ``,
          `result = add(3, 5)`,
          `print(result)`
        ],
        options: [`35`, `8`, `a + b`, `Nothing is printed`],
        answer: 1,
        hints: [
          "Put 3 into a and 5 into b.",
          "These are numbers, so + adds them."
        ],
        why: "add(3, 5) returns 3 + 5, which is 8. The value is stored in result and then printed."
      },
      {
        type: "output",
        q: "What will this program print?",
        code: [
          `def f():`,
          `    print("A")`,
          `    return "B"`,
          `    print("C")`,
          ``,
          `x = f()`,
          `print(x)`
        ],
        options: [`A\nB`, `A\nB\nC`, `B`, `A\nC\nB`],
        answer: 0,
        hints: [
          "The function prints A before it reaches return.",
          "Once return runs, the function ends. print(\"C\") is never reached."
        ],
        why: "f() prints A, then return ends the function and gives back \"B\". The line print(\"C\") never runs. Finally print(x) shows B."
      },
      {
        type: "bug",
        q: "The function prints None instead of 25. Tap the buggy line, then pick the fix.",
        code: [
          `def square(n):`,
          `    n * n`,
          ``,
          `print(square(5))`
        ],
        goal: "25",
        bug: 1,
        fixes: [
          `    return n * n`,
          `    print(n * n)`,
          `    return`,
          `    n * n = result`
        ],
        fix: 0,
        hints: [
          "The line n * n works out the answer but does nothing with it.",
          "The answer must be sent back to the caller."
        ],
        why: "Without return, a function gives back None. return n * n sends 25 back. print(n * n) would print 25 inside, but the outer print would then also show None."
      }
    ]
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: "bug-bazaar",
    emoji: "🐛",
    name: "Bug Bazaar",
    blurb: "Read error messages and fix mistakes like a pro.",
    learn: {
      points: [
        "An error is Python telling you what went wrong. Read the last line of the message first.",
        "NameError: you used a name that does not exist, often a typo or a wrong capital letter.",
        "TypeError: the wrong kind of value, like \"Age: \" + 15 (text plus number).",
        "IndexError: a list position that does not exist.",
        "ZeroDivisionError: you divided by 0.",
        "SyntaxError: the code breaks Python's grammar, for example a missing colon, quote or bracket."
      ],
      code: [
        `print(score)`
      ],
      output: "NameError: name 'score' is not defined"
    },
    levels: [
      {
        type: "output",
        q: "Which error does this program raise?",
        code: [`print(score)`],
        options: [`NameError`, `TypeError`, `SyntaxError`, `IndexError`],
        answer: 0,
        hints: [
          "Was a variable called score ever created?",
          "Using a name that was never defined gives this error."
        ],
        why: "score was never created, so Python does not know that name. That is a NameError."
      },
      {
        type: "output",
        q: "Which error does this program raise?",
        code: [`print("Age: " + 15)`],
        options: [`NameError`, `ZeroDivisionError`, `TypeError`, `IndexError`],
        answer: 2,
        hints: [
          "One side of + is text and the other is a number.",
          "Python will not join a string and a number with +. Wrong kind of value."
        ],
        why: "\"Age: \" is a string and 15 is a number, and + cannot mix them. That is a TypeError."
      },
      {
        type: "output",
        q: "Which error does this program raise?",
        code: [`a = 10`, `b = 0`, `print(a / b)`],
        options: [`TypeError`, `NameError`, `IndexError`, `ZeroDivisionError`],
        answer: 3,
        hints: [
          "Look at the value of b.",
          "Dividing by zero is impossible in maths, and in Python too."
        ],
        why: "b is 0, and no number can be divided by 0. Python raises a ZeroDivisionError."
      },
      {
        type: "output",
        q: "Which error does this program raise?",
        code: [`for i in range(3)`, `    print(i)`],
        options: [`SyntaxError`, `NameError`, `TypeError`, `IndexError`],
        answer: 0,
        hints: [
          "Check the end of the for line.",
          "The colon is missing. A broken grammar rule is reported before anything runs."
        ],
        why: "The for line has no colon at the end. Python cannot even read the program, so it reports a SyntaxError."
      },
      {
        type: "bug",
        q: "This program raises a NameError. Tap the buggy line, then pick the fix.",
        code: [
          `city = "Delhi"`,
          `greeting = "Welcome to "`,
          `print(greeting + City)`
        ],
        goal: "Welcome to Delhi",
        bug: 2,
        fixes: [
          `print(greeting + city)`,
          `print(greeting + "city")`,
          `print(greeting, city)`,
          `print(greeting + City())`
        ],
        fix: 0,
        hints: [
          "Compare the variable names on line 1 and line 3 very carefully.",
          "Python is case sensitive. City and city are different names."
        ],
        why: "The variable is called city, but line 3 used City. Using the exact name fixes it. Quotes around city would print the word city, and a comma would add an extra space."
      }
    ]
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: "boss-island",
    emoji: "👑",
    name: "Boss Island",
    blurb: "A mixed final test of everything you learned.",
    learn: {
      points: [
        "This island mixes all the earlier ideas: loops, conditions, functions and lists.",
        "Read the code slowly, line by line, and keep track of the variables on paper if you need to.",
        "Remember the hint button is there to help. It costs one star, not a heart.",
        "Finish all five levels to earn the Python Beginner badge."
      ],
      code: [
        `def is_big(n):`,
        `    return n > 10`,
        ``,
        `print(is_big(12))`
      ],
      output: "True"
    },
    levels: [
      {
        type: "output",
        q: "What will this program print?",
        code: [
          `numbers = [3, 6, 9]`,
          `total = 0`,
          `for n in numbers:`,
          `    total = total + n`,
          `print(total)`
        ],
        options: [`9`, `18`, `3`, `369`],
        answer: 1,
        hints: [
          "The loop goes through the list one number at a time.",
          "total collects 3, then 6, then 9."
        ],
        why: "total goes 0 → 3 → 9 → 18. The loop adds every item of the list to total."
      },
      {
        type: "fill",
        q: "Fill the blank so the function says whether a number is even.",
        code: [
          `def is_even(n):`,
          `    return n % 2 ____ 0`,
          ``,
          `print(is_even(10))`
        ],
        goal: "True",
        choices: ["==", "!=", ">", "<"],
        answers: ["=="],
        hints: [
          "An even number leaves a remainder of 0 when divided by 2.",
          "You need a sign that checks whether two values are equal."
        ],
        why: "10 % 2 is 0, so n % 2 == 0 is True. An even number always leaves remainder 0."
      },
      {
        type: "bug",
        q: "The program should print the biggest score, but prints 0. Tap the buggy line.",
        code: [
          `scores = [50, 70, 90]`,
          `best = 0`,
          `for s in scores:`,
          `    if s < best:`,
          `        best = s`,
          `print(best)`
        ],
        goal: "90",
        bug: 3,
        fixes: [
          `    if s > best:`,
          `    if s == best:`,
          `    if s <= best:`,
          `    if best > s:`
        ],
        fix: 0,
        hints: [
          "best starts at 0. Is any score smaller than 0?",
          "You want to replace best whenever a score is bigger than it."
        ],
        why: "No score is smaller than 0, so best never changed. Using s > best updates best each time a bigger score appears."
      },
      {
        type: "order",
        q: "Put the lines in the right order to get the goal output.",
        goal: "Hello, Asha\nHello, Ravi",
        lines: [
          `def greet(name):`,
          `    return "Hello, " + name`,
          `for person in ["Asha", "Ravi"]:`,
          `    print(greet(person))`
        ],
        hints: [
          "A function must be defined before the loop calls it.",
          "Each indented line stays directly below the line that owns it."
        ],
        why: "First define greet, then loop over the names and call greet for each one. The function must exist before it is used."
      },
      {
        type: "output",
        q: "Final boss: what will this program print?",
        code: [
          `def label(n):`,
          `    if n > 10:`,
          `        return "big"`,
          `    elif n > 5:`,
          `        return "medium"`,
          `    else:`,
          `        return "small"`,
          ``,
          `print(label(8))`,
          `print(label(3))`
        ],
        options: [`big\nsmall`, `medium\nsmall`, `medium\nmedium`, `small\nsmall`],
        answer: 1,
        hints: [
          "Follow label(8) first: which test is True first, n > 10 or n > 5?",
          "label(3) fails both tests, so it falls through to else."
        ],
        why: "8 is not above 10, but it is above 5, so label(8) returns medium. 3 passes neither test, so label(3) returns small."
      }
    ]
  }
];
