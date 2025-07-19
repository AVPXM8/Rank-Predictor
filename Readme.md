# NIMCET Rank Predictor & College Recommender

A full-stack web application designed to help NIMCET aspirants predict their potential rank and receive personalized college recommendations based on their expected marks and category. The project offers a clean UI, powerful backend, and seamless user experience, making it an essential tool for students preparing for the NIMCET exam.

---

## ✨ Key Features

- 🚀 **Instant Rank Prediction**  
  Calculates the expected rank range based on the student's marks and category (General, EWS, OBC, SC, ST, PWD).

- 🎓 **College Recommendations**  
  Suggests eligible NITs, IIITs, and other participating institutions dynamically based on predicted rank.

- 🔓 **Simple User Onboarding**  
  Quick and secure "No OTP" login using just name and phone number, enabling personalized predictions.

- ⏱️ **Prediction Limiter**  
  Restricts the number of predictions per user with unlimited access for admin numbers.



- 📱 **Fully Responsive Design**  
  Optimized for desktops, tablets, and mobile devices with a clean and modern UI.

---

## 🛠️ Technology Stack

### Frontend

- **HTML5** – Page structure  
- **CSS3** – Styling and responsive layout  
- **JavaScript** – Logic, interactivity, and `fetch()` API for communication  

### Backend

- **Node.js** – JavaScript runtime environment  
- **Express.js** – RESTful API and server-side logic  
- **Mongoose** – MongoDB ODM for defining schemas and handling data

### Database

- **MongoDB Atlas** – NoSQL cloud database for user and prediction data  

### Deployment & DevOps

- **Render.com** – Full-stack web service deployment  
- **Git & GitHub** – Version control and CI/CD pipeline

---

## 📥 Installation

Follow these steps to set up the project locally:

1. **Clone the repository**

    ```bash
    git clone https://github.com/AVPXM8/Rank-Predictor.git
    cd Rank-Predictor
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Set up environment variables**  
   Create a `.env` file in the root directory and add the following:

    ```env
    MONGODB_URI=your_mongodb_atlas_connection_string
    PORT=3000
    ```

4. **Run the application**

    ```bash
    npm run dev
    ```

    Visit your app at:  
    [http://localhost:3000](http://localhost:3000)

---

## 🚧 Future Improvements

- 📊 Visual analytics for admin on rank trends  
- 📬 Email results or college list to users  

- 🔐 JWT-based authentication for admin panel  
- 🌈 Dark mode support for better accessibility  
- 📊 Dashboard charts  

---

## 🤝 Contributing

**Contributions are welcome!**

If you’d like to improve something or add a new feature:

- Fork the repo  
- Create a new branch  
- Make your changes  
- Submit a pull request  

Please feel free to open issues for bugs or suggestions.

---





## 🙌 Acknowledgments

Developed with ❤️ for the NIMCET community  

- Data sources: Official NIT admission statistics  
- Built and maintained by **Vivek Kumar**  
- Inspired by the passion to support fellow aspirants

---

## 🔗 Useful Links

- 🔍 [NIMCET Official Website](https://www.nimcet.in)  
- 📘 [MongoDB Atlas](https://www.mongodb.com/atlas/database)  
- 📚 [Node.js Documentation](https://nodejs.org/en/docs/)  
- 💡 [Render Deployment Guide](https://render.com/docs/deploy-node-express-app)
