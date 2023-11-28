export interface JwtPayload {
    // Define the properties of the JWT payload here
    // For example, you may have an 'id' property to identify the user
    customer_id: number;
    email: string;
    app_id: number;
    // Add any other properties you want to include in the payload
}

