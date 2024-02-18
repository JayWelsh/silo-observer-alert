'use strict';

import { Express } from "express";

const RateRoutes = require('./rate.routes');

export default function routes(app: Express) {
    app.use("", RateRoutes);
}