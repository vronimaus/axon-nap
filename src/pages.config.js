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
import AdminDiagnostics from './pages/AdminDiagnostics';
import AdminHub from './pages/AdminHub';
import AdminTestCenter from './pages/AdminTestCenter';
import Dashboard from './pages/Dashboard';
import DevNotes from './pages/DevNotes';
import DiagnosisChat from './pages/DiagnosisChat';
import DiagnosisWizard from './pages/DiagnosisWizard';
import Discovery from './pages/Discovery';
import ExerciseImageGenerator from './pages/ExerciseImageGenerator';
import ExerciseImageUpload from './pages/ExerciseImageUpload';
import FAQ from './pages/FAQ';
import Flow from './pages/Flow';
import FlowRoutines from './pages/FlowRoutines';
import Glossary from './pages/Glossary';
import HowToUse from './pages/HowToUse';
import Imprint from './pages/Imprint';
import KnowledgeHub from './pages/KnowledgeHub';
import KnowledgeHubArticle from './pages/KnowledgeHubArticle';
import KnowledgeUpload from './pages/KnowledgeUpload';
import Landing from './pages/Landing';
import MFRIntegration from './pages/MFRIntegration';
import Performance from './pages/Performance';
import Privacy from './pages/Privacy';
import Profile from './pages/Profile';
import RehabPlan from './pages/RehabPlan';
import Success from './pages/Success';
import Terms from './pages/Terms';
import TrainingPlan from './pages/TrainingPlan';
import TrialInfo from './pages/TrialInfo';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDiagnostics": AdminDiagnostics,
    "AdminHub": AdminHub,
    "AdminTestCenter": AdminTestCenter,
    "Dashboard": Dashboard,
    "DevNotes": DevNotes,
    "DiagnosisChat": DiagnosisChat,
    "DiagnosisWizard": DiagnosisWizard,
    "Discovery": Discovery,
    "ExerciseImageGenerator": ExerciseImageGenerator,
    "ExerciseImageUpload": ExerciseImageUpload,
    "FAQ": FAQ,
    "Flow": Flow,
    "FlowRoutines": FlowRoutines,
    "Glossary": Glossary,
    "HowToUse": HowToUse,
    "Imprint": Imprint,
    "KnowledgeHub": KnowledgeHub,
    "KnowledgeHubArticle": KnowledgeHubArticle,
    "KnowledgeUpload": KnowledgeUpload,
    "Landing": Landing,
    "MFRIntegration": MFRIntegration,
    "Performance": Performance,
    "Privacy": Privacy,
    "Profile": Profile,
    "RehabPlan": RehabPlan,
    "Success": Success,
    "Terms": Terms,
    "TrainingPlan": TrainingPlan,
    "TrialInfo": TrialInfo,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};