const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path'); 
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const userSchema = require('./schemas/user');
const authorSchema = require('./schemas/author');
const bookSchema = require('./schemas/book');
const categorySchema = require('./schemas/category');


const app = express();

const uri = 'mongodb://localhost:27017/Websitebansach';

mongoose.connect(uri)
  .then(() => {
    const User = mongoose.model('User', userSchema);
    const Author = mongoose.model('Author', authorSchema);
    const Category = mongoose.model('Category', categorySchema);
    const Book = mongoose.model('Book', bookSchema);
    const store = new MongoDBStore({
      uri: uri,
      collection: 'sessions',
    });


    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(session({
      secret: 'Hehe',
      resave: false,
      saveUninitialized: true,
      store: store,
    }));


    app.get('/register', (req, res) => {
      res.sendFile(path.join(__dirname, 'views', 'register.html'));
    });

    app.get('/login', (req, res) => {
      res.sendFile(path.join(__dirname, 'views', 'login.html'));
    });

    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'views', 'index.html'));
    });

    app.get('/shop', (req, res) => {
      res.sendFile(path.join(__dirname, 'views', 'shop.html'));
    });

    app.get('/thank', (req, res) => {
      res.sendFile(path.join(__dirname, 'views', 'thankyou.html'));
    });

    app.get('/cart', (req, res) => {
      res.sendFile(path.join(__dirname, 'views', 'cart.html'));
    });

    app.get('/add_author', (req, res) => {
      res.sendFile(path.join(__dirname, 'views', 'add_author.html'));
    });

    app.get('/add_category', (req, res) => {
      res.sendFile(path.join(__dirname, 'views', 'add_category.html'));
    });

    app.get('/add_book',  async(req, res) => {
      res.sendFile(path.join(__dirname, 'views', 'add_book.html'));
    });

    // Định nghĩa route để tìm và truyền dữ liệu từ 2 bảng category + author vào thẻ select để thực hiện thêm sách
    app.get('/get_categories', async (req, res) => {
      try {
          const categories = await Category.find();
          res.json(categories);
      } catch (error) {
          console.error('Error fetching categories:', error);
          res.status(500).send('Failed to fetch categories');
      }
    });

    app.get('/get_authors', async (req, res) => {
      try {
          const authors = await Author.find();
          res.json(authors);
      } catch (error) {
          console.error('Error fetching authors:', error);
          res.status(500).send('Failed to fetch authors');
      }
    });
    //
    app.get('/get_books', async (req, res) => {
      try {
        const books = await Book.find();
        res.json(books);
      } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).send('Failed to fetch books');
      }
    });

    app.get('/check_login', (req, res) => {
      if (req.session.userId) {
        res.status(200).json({ loggedIn: true });
      } else {
        res.status(201).json({ loggedIn: false });
      }
    });
    
    // Endpoint for user logout
    app.get('/logout', (req, res) => {
      req.session.destroy(err => {
        if (err) {
          console.error('Error logging out:', err);
          return res.status(500).json({ error: 'Failed to logout' });
        }
        res.redirect('/login');
      });
    });

    //Post
    app.post('/register', async (req, res) => {
      try {
        const { username, password, email, address, phone_number } = req.body;
        const newUser = new User({ username, password ,email, address, phone_number });
        await newUser.save();
        res.status(201).redirect('/');
      } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Failed to register user');
      }
    });

    // Endpoint for user login
    app.post('/login', async (req, res) => {
      try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        
        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Set the userId in session
        req.session.userId = user._id;

        // Redirect user to the homepage after login
        res.status(200).redirect('/');
      } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Failed to login' });
      }
    });




    app.post('/add_author', async (req, res) => {
      try {
        const { author_name, dateofbirth } = req.body;
        const newAuthor = new Author({ author_name, dateofbirth });
        await newAuthor.save();
        res.status(201).send('Add new Author successfully');
      } catch (error) {
        console.error('Error in add new author:', error);
        res.status(500).send('Failed to add new author');
      }
    });

    app.post('/add_category', async (req, res) => {
      try {
        const { category_name } = req.body;
        const newCategory = new Category({ category_name });
        await newCategory.save();
        res.status(201).send('Add new Category successfully').redirect('/');
      } catch (error) {
        console.error('Error in add new Category:', error);
        res.status(500).send('Failed to add new Category');
      }
    });

    app.post('/add_book', async (req, res) => {
      try {
        console.log(req.body);
        const { book_name, category, description, publish_date, author, cover, price} = req.body;
        const newBook = new Book({ book_name, category, description, publish_date, author, cover, price });
        await newBook.save();
        res.status(201).redirect('/');
      } catch (error) {
        console.error('Error in add new book:', error);
        res.status(500).send('Failed to add new book');
      }
    });


    // Xóa sách theo ID
    app.delete('/delete_book/:id', async (req, res) => {
      try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).send('Invalid book ID');
        }
        await Book.findByIdAndDelete(id);
        res.status(200).send('Book deleted successfully');
      } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).send('Failed to delete book');
      }
    });




    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    app.set('view engine', 'ejs');
  })
  .catch(error => {
    console.error('Error connecting to MongoDB:', error);
  });

module.exports = app;
