CREATE TYPE "ShipmentIssueType" AS ENUM ('DELAYED', 'LOST', 'DAMAGED', 'WRONG_ITEM', 'ADDRESS_PROBLEM', 'COURIER_PROBLEM', 'CUSTOMER_UNAVAILABLE', 'OTHER');
CREATE TYPE "ShipmentIssueResponsibility" AS ENUM ('UNASSIGNED', 'COURIER', 'STORE', 'CUSTOMER', 'THIRD_PARTY');
CREATE TYPE "ShipmentIssueStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED');

CREATE TABLE "shipment_issues" (
  "id" TEXT NOT NULL,
  "shipment_id" TEXT NOT NULL,
  "type" "ShipmentIssueType" NOT NULL,
  "description" TEXT NOT NULL,
  "responsibility" "ShipmentIssueResponsibility" NOT NULL DEFAULT 'UNASSIGNED',
  "status" "ShipmentIssueStatus" NOT NULL DEFAULT 'OPEN',
  "resolution" TEXT,
  "created_by_email" TEXT,
  "resolved_by_email" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMP(3),
  CONSTRAINT "shipment_issues_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "shipment_issues_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "shipment_issue_events" (
  "id" TEXT NOT NULL,
  "issue_id" TEXT NOT NULL,
  "admin_email" TEXT,
  "from_status" "ShipmentIssueStatus",
  "to_status" "ShipmentIssueStatus",
  "responsibility" "ShipmentIssueResponsibility",
  "note" TEXT,
  "resolution" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shipment_issue_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "shipment_issue_events_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "shipment_issues"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "shipment_issues_shipment_id_status_created_at_idx" ON "shipment_issues"("shipment_id", "status", "created_at");
CREATE INDEX "shipment_issues_status_created_at_idx" ON "shipment_issues"("status", "created_at");
CREATE INDEX "shipment_issue_events_issue_id_created_at_idx" ON "shipment_issue_events"("issue_id", "created_at");
