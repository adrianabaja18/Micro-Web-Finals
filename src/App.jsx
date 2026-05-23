import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Bookings from "./pages/Bookings";
import Keys from "./pages/Keys";
import Logs from "./pages/Logs";
import Notifications from "./pages/Notifications";
import DeviceControl from "./pages/DeviceControl";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="keys" element={<Keys />} />
            <Route path="logs" element={<Logs />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="device-control" element={<DeviceControl />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}