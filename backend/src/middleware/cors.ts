import cors from 'cors';

const corsOptions = {
    origin: 'http://localhost:3000', // Allow requests from the Next.js frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};

export default cors(corsOptions);
