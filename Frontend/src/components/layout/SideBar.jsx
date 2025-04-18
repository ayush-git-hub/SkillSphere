import React from "react";
import { Telescope, BookOpen, Tv } from "lucide-react";
import { NavLink } from 'react-router-dom';

const mainSidebarItems = [
    { name: "Explore", icon: Telescope, link: "/explore" },
    { name: "Enrolled Courses", icon: BookOpen, link: "/enrolled-course" },
    { name: "Created Courses", icon: Tv, link: "/created-course" },
];

const SideBar = () => {
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
                        className={getNavLinkClass}
                    >
                        <item.icon className="size-4 flex-shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true" />
                        <span className="truncate">{item.name}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default SideBar;