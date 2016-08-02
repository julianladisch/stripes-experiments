#!/bin/sh

: ${tenant="our"}
: ${modules="trivial trivial-okapi"}

module_json=$(mktemp)
tenant_json=$(mktemp)

########################################
# same 1st tenant as manual
#
cat > $tenant_json <<END
{
  "id" : "$tenant",
  "name" : "$tenant library",
  "description" : "$tenant Library"
}
END

curl -w '\n' -X POST -D - \
  -H "Content-type: application/json" \
  -d @$tenant_json \
  http://localhost:9130/_/proxy/tenants



########################################
# modules
#
for module in $modules
do
    
# trivial module
cat > $module_json <<END
{
  "id" : "$module",
  "name" : "$module",
  "uiDescriptor" : {
     "npm" : "$module"
  }
}
END

curl -w '\n' -X POST -D - \
  -H "Content-type: application/json" \
  -d @$module_json  \
  http://localhost:9130/_/proxy/modules

# Enable tenant
tenant_enable_json=$(mktemp)
cat > $tenant_enable_json <<END
{
  "id" : "$module"
}
END

curl -w '\n' -X POST -D - \
  -H "Content-type: application/json" \
  -d @$tenant_enable_json  \
  http://localhost:9130/_/proxy/tenants/$tenant/modules

# get full info for trivial (repeat for each one returned above)
curl -w '\n' -D - http://localhost:9130/_/proxy/modules/$module
done

# get list of enabled modules for tenant
curl -w '\n' -D - http://localhost:9130/_/proxy/tenants/$tenant/modules

rm -f $module_json $tenant_json $tenant_enable_json
