"use client";

import { HighlightText } from "@/components/animate-ui/text/highlight";
import { CustomerInfoTabs } from "./customer-info-tabs";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

export const CustomerInformationMainSection = () => {
  const customersQuery = useQuery(
    orpc.admin.customerInfo.getAllCustomers.queryOptions(),
  );
  const customersData = customersQuery.data;

  return (
    <div className="min-h-screen w-full p-4 max-w-7xl">
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div>
              <span className={"text-2xl font-semibold"}>
                You have a total of{" "}
                <HighlightText
                  className="font-semibold"
                  text={`${customersData?.filter((customer) => customer.Customer.isActive).length ?? "_"}`}
                />{" "}
                active customers with{" "}
                <HighlightText
                  className="font-semibold"
                  text={`${customersData?.map((customer) => Number(customer.Customer.deposit) || 0).reduce((a, b) => a + b, 0) ?? "_"}`}
                />{" "}
                deposit bottles.
              </span>
            </div>
            <CustomerInfoTabs data={customersData} />
          </div>
        </div>
      </div>
    </div>
  );
};
