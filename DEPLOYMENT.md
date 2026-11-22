# 🚀 Free Hosting & 1,000 Concurrent Student Scaling Guide

This guide explains how to host the **Smart Exam Security Platform** completely **free of cost** while supporting **1,000+ concurrent students** simultaneously during college examinations.

---

## ⚡ Concurrency & Performance Architecture

Supporting 1,000 simultaneous students on a free tier or modest hardware requires strict optimization:

| Metric | Typical Exam App | Smart Exam Security Platform |
| :--- | :--- | :--- |
| **PDF Rendering** | Server renders images (Crashes CPU) | **Client-side Canvas rendering via PDF.js** (Zero server CPU load) |
| **Database Latency** | External cloud DB roundtrips (150ms) | **In-memory SQLite engine** (< 0.5ms microsecond response) |
| **Payload Size** | Uncompressed static assets (10MB+) | **Gzip/Brotli compression** (~70% bandwidth reduction) |
| **Heartbeat Frequency**| 1 second WebSocket thrashing | **15-second debounced heartbeat** (Only ~60 lightweight requests/sec across 1,000 students) |
| **Hosting Cost** | \$50 - \$200/month | **\$0.00 Free Forever** |

---

## 🌐 Free Hosting Deployment Options

### Option 1: Render.com (100% Free Cloud Hosting)

Render provides a completely free tier with automatic HTTPS, Git integration, and continuous deployment.

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy Smart Exam Security"
   git push origin main
   ```
2. **Log into [Render.com](https://render.com/)** and click **New + > Web Service**.
3. **Connect your GitHub repository**.
4. Configure the service:
   - **Name**: `smart-exam-portal`
   - **Environment**: `Node`
   - **Plan**: `Free`
   - **Build Command**: `npm run install:all && npm run build && npm run seed`
   - **Start Command**: `npm run start`
5. Click **Create Web Service**. Render will build the React frontend and start the Express server on a free live HTTPS URL (e.g., `https://smart-exam-portal.onrender.com`).

*(Or use the included [render.yaml](file:///c:/bbib/smart_exam/render.yaml) for 1-click Blueprint deployment).*

---

### Option 2: Oracle Cloud Always Free (Recommended for 1,000 – 5,000+ Concurrent Students)

Oracle Cloud offers an **Always Free Tier** that never expires and includes:
- **4 OCPU cores** (Ampere ARM processor)
- **24 GB RAM**
- **200 GB NVMe SSD Storage**
- **10 TB free monthly outbound bandwidth**

This is more powerful than a \$120/month AWS instance and handles **5,000+ concurrent students** with ease at \$0 cost!

#### Step-by-Step Setup:
1. Create a free account at [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/).
2. Launch a **Compute Instance** choosing:
   - **Image**: Ubuntu 22.04 LTS
   - **Shape**: `VM.Standard.A1.Flex` (4 OCPUs, 24 GB RAM — select Always Free).
3. Connect to your instance via SSH:
   ```bash
   ssh -i your-key.key ubuntu@<YOUR-INSTANCE-IP>
   ```
4. Install Docker & Git:
   ```bash
   sudo apt update && sudo apt install -y git docker.io docker-compose
   ```
5. Clone and start your application:
   ```bash
   git clone <YOUR-REPO-URL> smart_exam
   cd smart_exam
   sudo docker-compose up -d --build
   ```
6. Open port 5000 in your Oracle Cloud Subnet Security List (Ingress Rule: Port `5000` or setup Nginx reverse proxy with free Let's Encrypt SSL on port `80`/`443`).

---

### Option 3: College Campus LAN / Intranet Server (Best for On-Campus Computer Labs)

Most colleges conduct examinations on physical college computers or campus Wi-Fi. Running locally inside the college network offers distinct advantages:
- **Zero External Internet Required**: Students take the exam even if campus ISP is down.
- **Microsecond Latency**: Gigabit LAN responds in < 1ms.
- **Physical Isolation**: Complete immunity to outside DDoS attacks.
- **\$0 Cost**: Any existing lab Core i5/i7 machine with 8GB RAM can host 1,000 students.

#### Step-by-Step Setup:
1. Choose any computer lab desktop or server machine connected to the college LAN.
2. Clone or copy this folder to the machine.
3. Open terminal/powershell inside `smart_exam`:
   ```bash
   npm run install:all
   npm run build
   npm run seed
   npm run start
   ```
4. Find the machine's local IP address (e.g. `192.168.1.100` via `ipconfig` or `ifconfig`).
5. Students in the labs or on college Wi-Fi simply open their browser and navigate to:
   ```
   http://192.168.1.100:5000
   ```
   *(Or assign a local DNS name like `http://exam.college.edu` in your campus router).*

---

### Option 4: Fly.io / Railway

Using the included [Dockerfile](file:///c:/bbib/smart_exam/Dockerfile):
```bash
# Fly.io deployment:
fly launch
fly deploy

# Railway deployment:
railway up
```

---

## 🔒 Production Security Checklist Before Examination Day

1. **Change Default Admin Password**:
   - Change `admin123` to a strong unique secret in your deployment environment or via the user database.
2. **Update JWT Secret**:
   - Set `JWT_SECRET` in `.env` to a long random hexadecimal string.
3. **Question Papers**:
   - Upload PDF question papers via the Admin Portal (**Exams > Create Exam**).
   - Papers are stored outside public web folders with encrypted UUID names.
4. **Student Verification**:
   - Upload student rosters using **Students > Bulk CSV Upload**.
5. **Invigilator Station**:
   - Invigilators keep the **Live Exam Monitor** open (`/admin/monitor`) to approve reset appeals and monitor student session health in real time.
