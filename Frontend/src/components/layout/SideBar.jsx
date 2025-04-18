// import React from "react";
// import { Telescope, BookOpen, PlusCircle, Tv } from "lucide-react"; // Added PlusCircle
// import { NavLink } from 'react-router-dom';

// // Define sidebar items - easier to manage
// const mainSidebarItems = [
//     { name: "Explore", icon: Telescope, link: "/explore" },
//     { name: "Enrolled Courses", icon: BookOpen, link: "/enrolled-course" },
//     { name: "Created Courses", icon: Tv, link: "/created-course" },
// ];

// const SideBar = () => {
//     // Function to generate className for NavLink
//     const getNavLinkClass = ({ isActive }) =>
//         `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out group
//          ${isActive
//             ? "bg-primary text-primary-foreground shadow-sm" // Active state style
//             : "text-muted-foreground hover:bg-accent hover:text-accent-foreground" // Default & hover state
//         }`;

//     return (
//         // Added pt-20 for potential close button space + navbar height on mobile, reduced on lg
//         <div className="w-full h-full bg-card p-4 pt-20 lg:pt-6 flex flex-col">
//             <nav className="space-y-1.5 flex-grow"> {/* flex-grow allows spacing */}
//                 {mainSidebarItems.map((item) => (
//                     <NavLink
//                         key={item.name}
//                         to={item.link}
//                         end // Use 'end' prop for exact matching
//                         className={getNavLinkClass}
//                     >
//                         <item.icon className="size-4 flex-shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true" />
//                         <span className="truncate">{item.name}</span>
//                     </NavLink>
//                 ))}
//             </nav>
//         </div>
//     );
// };

// export default SideBar;









// src/components/layout/SideBar.jsx
// Removed the 'end' prop from NavLink to allow highlighting parent routes
import React from "react";
import { Telescope, BookOpen, Tv } from "lucide-react"; // Keep PlusCircle if needed elsewhere, removed Tv for simplicity if not used
import { NavLink } from 'react-router-dom';

// Define sidebar items
const mainSidebarItems = [
    { name: "Explore", icon: Telescope, link: "/explore" },
    { name: "Enrolled Courses", icon: BookOpen, link: "/enrolled-course" },
    { name: "Created Courses", icon: Tv, link: "/created-course" }, // Changed icon example
];

const SideBar = () => {
    // Function to generate className for NavLink
    // isActive will now be true if the current path starts with the link's path
    const getNavLinkClass = ({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out group
         ${isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        }`;

    return (
        <div className="w-full h-full bg-card p-4 pt-20 lg:pt-6 flex flex-col">
            <nav className="space-y-1.5 flex-grow">
                {mainSidebarItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.link}
                        // Removed the 'end' prop here
                        className={getNavLinkClass}
                    >
                        <item.icon className="size-4 flex-shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true" />
                        <span className="truncate">{item.name}</span>
                    </NavLink>
                ))}
            </nav>
            {/* Optional: Add Create Course button here if desired */}
            {/* <div className="mt-auto pt-4">
                 <NavLink to="/created-course/create-new-course" className={getNavLinkClass}>
                     <PlusCircle className="size-4 flex-shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true" />
                     <span>Create Course</span>
                 </NavLink>
             </div> */}
        </div>
    );
};

export default SideBar;