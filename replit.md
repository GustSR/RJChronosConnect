# RJChronos Network Management Platform

## Overview

RJChronos is a comprehensive network management platform designed for telecom operators to monitor and manage fiber optic networks. The system provides real-time monitoring of OLTs (Optical Line Terminals), ONUs (Optical Network Units), and CPEs (Customer Premises Equipment) through a TR-069 ACS server implementation. The platform features AI-powered automation, zero-touch provisioning, and intelligent diagnostics to streamline network operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React SPA**: Built with React 18 and TypeScript for type safety and modern development practices
- **UI Framework**: Implements shadcn/ui components with Radix UI primitives for consistent, accessible design
- **Styling**: Uses Tailwind CSS with a custom dark theme optimized for network operations centers
- **State Management**: TanStack Query for server state management with optimistic updates and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Express.js API**: RESTful API server with middleware for authentication, logging, and error handling
- **TR-069 ACS Server**: Custom implementation for managing CPE devices using the TR-069 protocol
- **Real-time Communication**: WebSocket server for live device status updates and alerts
- **Service Layer**: Modular services for monitoring, automation, and TR-069 operations
- **Authentication**: OpenID Connect integration with Replit authentication system
- **Session Management**: PostgreSQL-based session storage with secure cookie handling

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting for scalability
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Schema Design**: Comprehensive network device hierarchy (OLT → PON Port → ONU → CPE)
- **Session Storage**: PostgreSQL sessions table for authentication state
- **Migration System**: Drizzle Kit for database schema versioning and migrations

### Authentication and Authorization
- **OpenID Connect**: Integration with Replit's authentication system
- **Passport.js**: Authentication middleware with strategy pattern
- **Session-based Auth**: Secure session management with HTTP-only cookies
- **Role-based Access**: User roles (admin, operator, viewer) with different permission levels
- **CSRF Protection**: Built-in protection against cross-site request forgery

### External Dependencies
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support
- **Replit Authentication**: OpenID Connect provider for user management
- **TR-069 Protocol**: Industry standard for remote management of CPE devices
- **shadcn/ui**: Pre-built accessible components based on Radix UI
- **Fast-XML-Parser**: XML processing for TR-069 SOAP messages
- **Date-fns**: Date manipulation and formatting with Brazilian Portuguese locale
- **React Hook Form**: Form validation and submission with Zod schema validation

### Network Device Management
- **Device Hierarchy**: Structured management of OLTs, PON ports, ONUs, and CPEs
- **Status Monitoring**: Real-time device status tracking with automated health checks
- **Firmware Management**: Centralized firmware updates and version tracking
- **Configuration Profiles**: Template-based device configuration management
- **Zero-touch Provisioning**: Automatic device configuration on first connection

### Automation and AI Features
- **Rule-based Automation**: Configurable automation rules for common network operations
- **AI Insights**: Predictive analytics for device failure detection and performance optimization
- **Alert Management**: Intelligent alerting system with severity levels and acknowledgment tracking
- **Performance Analytics**: Historical data analysis and trend detection
- **Action Logging**: Comprehensive audit trail of all system actions and changes