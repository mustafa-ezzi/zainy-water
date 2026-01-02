import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable6CustomerInformation } from "./data-table-6-customer-info";
import { CustomerAddForm } from "./customer-add-form";
import LoadingSpinner from "@/components/hydration-states/loading-state";
import { z } from "zod";
import { GetAllCustomersRecords } from "@/modules/admin/customer-information/server/getAllCustomers.orpc";

type Props = {
  data: z.infer<typeof GetAllCustomersRecords>[] | undefined;
};

export const CustomerInfoTabs = ({ data: customersData }: Props) => {
  if (!customersData) {
    return (
      <div className="flex w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const activeCustomers = customersData.filter(
    (data) => data.Customer.isActive,
  );
  const inactiveCustomers = customersData.filter(
    (data) => !data.Customer.isActive,
  );

  return (
    <Tabs defaultValue="customer_list" className="w-full">
      <TabsList>
        <TabsTrigger value="customer_list">Customer List</TabsTrigger>
        <TabsTrigger value="add_customer">Add Customer</TabsTrigger>
      </TabsList>
      <TabsContent value="customer_list" className="w-full mt-6">
        <div className="flex flex-col gap-y-4">
          <DataTable6CustomerInformation data={activeCustomers} />
          <h1 className="w-full text-red-400 font-bold font-mono text-xl mt-10">
            Inactive Customers:
          </h1>
          <DataTable6CustomerInformation data={inactiveCustomers} />
        </div>
      </TabsContent>
      <TabsContent value="add_customer">
        <CustomerAddForm />
      </TabsContent>
    </Tabs>
  );
};
