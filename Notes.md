# Notes

## Introduction

We'll be writing some code in Python 3.

- Python is a programming language.
- It is a way for us to tell computers what to do.

Don't be afraid, it won't bite!

- Write whatever you want. Seriously.
- There is no penalty for doing something "wrong". We write bugs every day!
- If something breaks, it means there's a bug with this website...

And please feel free to ask questions.

## Task 1

### Printing, strings and things

`print()` is a function. It is a built-in part of the language that lets us *print* text to the screen. We've hooked it up with text-to-speech.

```python
print('Hello there')
```

We use surrounding quotes `''` or `""` to signify *text*, which we call *strings*. Otherwise, we might be misinterpreted.

```python
print('1 + 1')
print(1 + 1)
```

(Bonus: this demonstrates the language also has *numbers*. Oh, and mathematics. The horror!)

### Comments

We can place a hash `#` at the start of a line to indicate that it is a *comment*. This is for humans to read, and can be useful to explain what some complex code means. Computers ignore it.

```python
# This was either written by an arsehole or an old person.
print('sorry for your loss lol')
```

### Variables

We can give names to *things*. We can then re-use this name afterwards, and a computer will know what we mean by it.

```python
first_name = 'Andrew'
print(first_name)
print(first_name)
```

(Variable names can't contain spaces, so we separate words in other ways like `first_name`, `firstName` or `FirstName`.)

### Print nursery rhyme

## Task 2

### More variables

Our *variables* can *vary*. We can change what they mean.

```python
company = 'ANZ'
print(company)
company = 'SEEK'
print(company)
```

The equals sign `=` is not a *test of equality*! It makes a variable on the left side *mean* what is on the right side. They are equal after this point, but not necessarily forever — they are *variable* after all!

```python
company = 'ANZ'
# Company means 'ANZ'.

company = 'SEEK'
# Company means 'SEEK'. It no longer means 'ANZ'.
```

Here's what happens when we name a variable:

```python
# We have some text.
'Andrew'

# We are giving a name to the text.
= 'Andrew'

# And here's the name.
first_name = 'Andrew'
```

### Swap variables

## Task 3

### True/False

We can test actual equality by using two equals signs `==`.

```python
print(1 == 2)
print(1 == 1)
```

We can perform other kinds of comparisons, too:

```python
print(1 < 2)
print(2 >= 2)
```

### Choosing

`if` lets us *choose* whether to do something, depending on a criteria.

```python
if 1 == 1:
    print("Phew, that's a relief")
else:
    print("If you're reading this it's too late")
```

### Print conditionally

## Task 4

### Lists

So far, we've seen text and numbers. How about lists?

```python
['ceo', 'hr manager', 'developer', 'cs rep']
```

We can get an individual item based on its position in the list.

```python
jobs = ['ceo', 'hr manager', 'developer', 'cs rep']
jobs[0]
jobs[3]
```

(Note that positions start at 0!)

### Addition

Let's briefly sidetrack to look at what the plus operator `+` can do.

```python
print(1 + 1)
print("SE" + "EK")
print(["Two"] + ["Words"])
```

We can add to an existing thing.

```python
company = "SE"
company = company + "EK"
print(company)
```

### Pick out list items

## Task 5

### In

How can we check if something is in a list?

```python
jobs = ['ceo', 'hr manager', 'developer', 'cs rep']
job_i_want = 'ceo'

print(job_i_want in jobs)
```

How about finding some text within a larger piece of text?

```python
resume = "...I have extensive programming experience in F sharp, C sharp, C major, A minor..."""

print("cooking" in resume)
print("programming" in resume)
```

### Looping

`for` lets us *loop* through a list. We get each item in order, and can do something with the item.

```python
words = ['Hello', 'there']

for word in words:
    print(word)
```

We can do more than just print.

```python
old_numbers = [1, 2, 3]
new_numbers = []

for o in old_numbers:
    n = o * 2
    new_numbers = new_numbers + [n]

print(new_numbers)
```

### Search algorithm
