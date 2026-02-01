/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Dashboard from './pages/Dashboard';
import DevNotes from './pages/DevNotes';
import DiagnosisChat from './pages/DiagnosisChat';
import DiagnosisWizard from './pages/DiagnosisWizard';
import ExerciseImageGenerator from './pages/ExerciseImageGenerator';
import Flow from './pages/Flow';
import FlowSelection from './pages/FlowSelection';
import Glossary from './pages/Glossary';
import Imprint from './pages/Imprint';
import Landing from './pages/Landing';
import MFRIntegration from './pages/MFRIntegration';
import Performance from './pages/Performance';
import PerformanceChat from './pages/PerformanceChat';
import PerformanceTest from './pages/PerformanceTest';
import PerformanceTestChoice from './pages/PerformanceTestChoice';
import Privacy from './pages/Privacy';
import Profile from './pages/Profile';
import ProfileComparison from './pages/ProfileComparison';
import QuickDemo from './pages/QuickDemo';
import Success from './pages/Success';
import Terms from './pages/Terms';
import TrainingPlan from './pages/TrainingPlan';
import TrialInfo from './pages/TrialInfo';
import RehabPlan from './pages/RehabPlan';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "DevNotes": DevNotes,
    "DiagnosisChat": DiagnosisChat,
    "DiagnosisWizard": DiagnosisWizard,
    "ExerciseImageGenerator": ExerciseImageGenerator,
    "Flow": Flow,
    "FlowSelection": FlowSelection,
    "Glossary": Glossary,
    "Imprint": Imprint,
    "Landing": Landing,
    "MFRIntegration": MFRIntegration,
    "Performance": Performance,
    "PerformanceChat": PerformanceChat,
    "PerformanceTest": PerformanceTest,
    "PerformanceTestChoice": PerformanceTestChoice,
    "Privacy": Privacy,
    "Profile": Profile,
    "ProfileComparison": ProfileComparison,
    "QuickDemo": QuickDemo,
    "Success": Success,
    "Terms": Terms,
    "TrainingPlan": TrainingPlan,
    "TrialInfo": TrialInfo,
    "RehabPlan": RehabPlan,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};