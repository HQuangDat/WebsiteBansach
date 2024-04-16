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
const orderSchema = require('./schemas/order');


const app = express();

const uri = 'mongodb://localhost:27017/Websitebansach';

mongoose.connect(uri)
  .then(() => {
    const User = mongoose.model('User', userSchema);
    const Author = mongoose.model('Author', authorSchema);
    const Category = mongoose.model('Category', categorySchema);
    const Book = mongoose.model('Book', bookSchema);
    const Order = mongoose.model('Order', orderSchema);
    const store = new MongoDBStore({
      uri: uri,
      collection: 'sessions',
    });

    var methodOverride = require('method-override')
    app.use(methodOverride('_method'))
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(session({
      secret: 'Hehe',
      resave: false,
      saveUninitialized: true,
      store: store,
    }));

    app.get('/admin', authAdmin, (req, res) => {
      res.sendFile(path.join(__dirname, 'views/adminview', 'admin.html'));
    });

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

    app.get('/checkout', (req, res) => {
      res.sendFile(path.join(__dirname, 'views', 'checkout.html'));
    });

    app.get('/add_author', authAdmin, (req, res) => {
      res.sendFile(path.join(__dirname, 'views/adminview', 'add_author.html'));
    });

    app.get('/add_category', authAdmin, (req, res) => {
      res.sendFile(path.join(__dirname, 'views/adminview', 'add_category.html'));
    });

    app.get('/add_book', authAdmin, async (req, res) => {
      res.sendFile(path.join(__dirname, 'views/adminview', 'add_book.html'));
    });

    app.get('/book_manager', authAdmin, (req, res) => {
      res.sendFile(path.join(__dirname, 'views/adminview', 'book_manager.html'));
    });
  
    
    app.get('/edit_book/:id', authAdmin, async (req, res) => {
      try {
        const { id } = req.params;
    
        const book = await Book.findById(id);
    
        if (!book) {
          return res.status(404).send('Book not found');
        }
        
        res.render('adminview/edit_book', { book });
      } catch (error) {
        console.error('Error fetching book for editing:', error);
        res.status(500).send('Failed to fetch book for editing');
      }
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

    //Lấy tất cả các sách
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

    // User logout
    app.get('/logout', (req, res) => {
      req.session.destroy(err => {
        if (err) {
          console.error('Error logging out:', err);
          return res.status(500).json({ error: 'Failed to logout' });
        }
        res.redirect('/login');
      });
    });

    // Profile
    app.get('/profile', async (req, res) => {
      try {
        if (!req.session.userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await User.findById(req.session.userId);

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ user });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
      }
    });


    //Chức năng đăng ký
    app.post('/register', async (req, res) => {
      try {
        const { username, password, email, address, phone_number } = req.body;
        const newUser = new User({ username, password, email, address, phone_number });
        await newUser.save();
        res.status(201).redirect('/');
      } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Failed to register user');
      }
    });

    // Đăng nhập
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



    //Thêm tác giả
    app.post('/add_author', authAdmin, async (req, res) => {
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

    //Thêm thể loại
    app.post('/add_category', authAdmin, async (req, res) => {
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

    app.post('/add_book', authAdmin, async (req, res) => {
      try {
        console.log(req.body);
        const { book_name, category, description, publish_date, author, cover, price } = req.body;
        const newBook = new Book({ book_name, category, description, publish_date, author, cover, price });
        await newBook.save();
        res.status(201).redirect('/');
      } catch (error) {
        console.error('Error in add new book:', error);
        res.status(500).send('Failed to add new book');
      }
    });


    // Handle checkout request
    app.post('/checkout', (req, res) => {
      const { shippingAddress, paymentMethod, cartItems } = req.body;

      if (!shippingAddress || !cartItems || cartItems.length === 0) {
        return res.status(400).send('Shipping address and at least one book are required');
      }

      // Calculate total price based on cart items
      let totalPrice = 0;
      cartItems.forEach(item => {
        totalPrice += item.price * item.quantity;
      });

      const newOrder = new Order({
        user: req.session.userId,
        books: cartItems.map(item => item._id),
        shipping_address: shippingAddress,
        total_price: totalPrice,
        payment_method: paymentMethod
      });

      newOrder.save()
        .then(() => {
          req.session.cartItems = [];
          res.status(201).send('Order placed successfully');
        })
        .catch(error => {
          console.error('Error placing order:', error);
          res.status(500).send('Failed to place order');
        });
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

    //--------------------------Admin-----------------

    // Khai báo middleware authAdmin
    async function authAdmin(req, res, next) {
      try {
        // Kiểm tra xem session đã có userId chưa
        if (!req.session || !req.session.userId) {
          res.status(403);
          return res.send('You need to sign in.');
        }

        // Tìm thông tin người dùng từ cơ sở dữ liệu
        const user = await User.findById(req.session.userId);

        // Kiểm tra xem người dùng tồn tại và có vai trò là 'Admin' không
        if (user.role !== 'Admin') {
          res.status(401);
          return res.send('Not allowed.');
        }

        // Nếu người dùng đã đăng nhập và có vai trò là 'Admin', cho phép tiếp tục xử lý request
        next();
      } catch (error) {
        console.error('Error checking admin role:', error);
        res.status(500);
        return res.send('Internal Server Error');
      }
    }

    app.get('/admin', authAdmin, (req, res) => {

    });

    // Xóa đơn hàng theo ID
    app.delete('/delete_order/:id', async (req, res) => {
      try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).send('Invalid order ID');
        }
        await Book.findByIdAndDelete(id);
        res.status(200).send('Order deleted successfully');
      } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).send('Failed to delete order');
      }
    });


    // Edit book
    app.put('/edit_book/:id', authAdmin, async (req, res) => {
      try {
        const { id } = req.params;
        const { book_name, category, description, publish_date, author, price } = req.body;
    
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).send('Invalid book ID');
        }
    
        // Find the existing book by ID
        const existingBook = await Book.findById(id);
    
        if (!existingBook) {
          return res.status(404).send('Book not found');
        }
    
        // Update the book fields with new data
        existingBook.book_name = book_name;
        existingBook.category = category;
        existingBook.description = description;
        existingBook.publish_date = publish_date;
        existingBook.author = author;
        existingBook.price = price;
    
        // Save the updated book
        await existingBook.save();
    
        res.status(200).send('Book updated successfully');
      } catch (error) {
        console.error('Error editing book:', error);
        res.status(500).send('Failed to edit book');
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
