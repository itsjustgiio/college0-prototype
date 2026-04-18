import { Link } from "react-router";
import { GraduationCap, ArrowRight } from "lucide-react";

export function Cover() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-8">
      <div className="max-w-4xl text-center text-white">
        <div className="w-24 h-24 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mx-auto mb-8">
          <GraduationCap className="w-14 h-14" />
        </div>

        <h1 className="text-6xl mb-6">College0</h1>
        <h2 className="text-3xl mb-4 text-blue-100">AI-Enabled College Program Management System</h2>

        <div className="max-w-2xl mx-auto mb-12">
          <p className="text-xl text-blue-100 mb-6">
            A comprehensive desktop web prototype demonstrating role-based dashboards,
            intelligent course recommendations, and streamlined program management.
          </p>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
              <div className="text-3xl mb-2">4</div>
              <div className="text-blue-200">User Roles</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
              <div className="text-3xl mb-2">10</div>
              <div className="text-blue-200">Prototype Screens</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
              <div className="text-3xl mb-2">AI</div>
              <div className="text-blue-200">Powered Features</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Link
            to="/public"
            className="px-8 py-4 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors inline-flex items-center gap-2"
          >
            Explore Public View
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/student"
            className="px-8 py-4 bg-white/10 backdrop-blur-lg text-white border-2 border-white/30 rounded-lg hover:bg-white/20 transition-colors inline-flex items-center gap-2"
          >
            Student Portal
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/instructor"
            className="px-8 py-4 bg-white/10 backdrop-blur-lg text-white border-2 border-white/30 rounded-lg hover:bg-white/20 transition-colors inline-flex items-center gap-2"
          >
            Instructor Portal
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/registrar"
            className="px-8 py-4 bg-white/10 backdrop-blur-lg text-white border-2 border-white/30 rounded-lg hover:bg-white/20 transition-colors inline-flex items-center gap-2"
          >
            Registrar Portal
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="text-sm text-blue-200">
          <p>High-Fidelity Desktop Web Prototype</p>
        </div>
      </div>
    </div>
  );
}
