import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');

    let query = supabaseAdmin
      .from('work_assignments')
      .select(`
        id,
        employee_id,
        work_area_id,
        event_id,
        assigned_at,
        employee:employees(id, name, role, phone_number),
        work_area:work_areas(id, name, location)
      `);
    
    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query.order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching work assignments:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error in work assignments GET:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { employee_id, work_area_id, event_id, action } = await request.json();

    if (!employee_id || !event_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Employee ID and Event ID are required' 
      }, { status: 400 });
    }

    if (action === 'remove') {
      // Remove assignment
      const { error } = await supabaseAdmin
        .from('work_assignments')
        .delete()
        .eq('employee_id', employee_id)
        .eq('event_id', event_id);

      if (error) {
        console.error('Error removing work assignment:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Assignment removed successfully'
      });
    } else {
      // Create or update assignment
      if (!work_area_id) {
        return NextResponse.json({ 
          success: false, 
          error: 'Work Area ID is required for assignment' 
        }, { status: 400 });
      }

      // Check if assignment already exists
      const { data: existingAssignment } = await supabaseAdmin
        .from('work_assignments')
        .select('id')
        .eq('employee_id', employee_id)
        .eq('event_id', event_id)
        .single();

      if (existingAssignment) {
        // Update existing assignment
        const { data, error } = await supabaseAdmin
          .from('work_assignments')
          .update({
            work_area_id: work_area_id,
            assigned_at: new Date().toISOString()
          })
          .eq('id', existingAssignment.id)
          .select(`
            id,
            employee_id,
            work_area_id,
            event_id,
            assigned_at,
            employee:employees(id, name, role, phone_number),
            work_area:work_areas(id, name, location)
          `)
          .single();

        if (error) {
          console.error('Error updating work assignment:', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data,
          message: 'Assignment updated successfully'
        });
      } else {
        // Create new assignment
        const { data, error } = await supabaseAdmin
          .from('work_assignments')
          .insert({
            employee_id,
            work_area_id,
            event_id
          })
          .select(`
            id,
            employee_id,
            work_area_id,
            event_id,
            assigned_at,
            employee:employees(id, name, role, phone_number),
            work_area:work_areas(id, name, location)
          `)
          .single();

        if (error) {
          console.error('Error creating work assignment:', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data,
          message: 'Assignment created successfully'
        });
      }
    }
  } catch (error) {
    console.error('Error in work assignments POST:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

// Auto-assign employees to work areas
export async function PUT(request: Request) {
  try {
    const { event_id } = await request.json();

    if (!event_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event ID is required' 
      }, { status: 400 });
    }

    // Get employees that are selected for this event
    const { data: selectedEmployees, error: employeesError } = await supabaseAdmin
      .from('employee_event_status')
      .select(`
        employee_id,
        employee:employees(id, name, role, employment_type, is_always_needed)
      `)
      .eq('event_id', event_id)
      .eq('status', 'selected');

    if (employeesError) {
      console.error('Error fetching selected employees:', employeesError);
      return NextResponse.json({ success: fals
}  );
  }: 500 }
  tatus      { s
curred' },n error ocknow : 'An unssager.meor ? errorrf Er instanceo erro error:se,success: fal
      { n(sotResponse.j Nexrn retu
   , error);:'o-assignments autign assr in workr('Erroerronsole.) {
    coh (error} catc    });
  ed'
reatnments ce: 'No assigmessag[],
         data: e,
    truess:cc     sue.json({
  NextRespons
    return}
  });
    areas`
    to work ployees  0} ema?.length ||${dated gnsfully assi: `Succes message       | [],
data |data: e,
        uccess: tru       sn({
 soResponse.jturn Next
      re
});
      }0 : 50, { statuse }rror.messagor: e: false, err{ successn(sponse.jsoNextRe return 
       r);s:', erronment assigreatingrror cror('E.eronsole
        c) {ror (er

      if       `);ation)
 e, locamid, nwork_areas(ork_area:   w      number),
 one_me, role, phyees(id, naoyee:emplo  empl   ,
     _atigned         ass_id,
  event,
         a_id_arework    ,
      ployee_id          em     id,
(`
       .select)
      ignments.insert(ass')
        ignments'work_ass.from(     
   minsupabaseAdr } = await { data, erro   const  0) {
   .length >gnmentsf (assi
    intsmeall assignert 
    // Ins}
    }
   }
       +;
    ea+ssignedToAr          a    });
     vent_id
 ent_id: e      ev      ,
a.idre: workAwork_area_id            ployee_id,
.emloyeed: empmployee_i   e        h({
 ignments.pus         assyee) {
  (emplo     ifhift();
   oyeePool.syee = empl emploonst  c{
      )  0.length >oyeePoolty && emplacimax_caporkArea.a < wnedToAre (assig  while    loyees
ailable emp avy with anypacitemaining ca Fill r    //}

                }
a++;
AregnedTosi        as

            }x, 1);
Indeoll.splice(pomployeePoo e          ) {
 olIndex > -1pof (   i       _id);
employeeyee. === emploee_id emp.employex(emp =>Pool.findInd= employeet poolIndex cons          ment
e assignd doublpool to avoiemove from  R  //

          });      event_id
  ent_id: ev       
     ,idkArea.d: wor_area_i      work      _id,
mployee employee.eployee_id:      em  h({
    .pus assignments        es[i];
 chingEmployeee = matonst employ          c
n; i++) {oAssig < t; iet i = 0   for (l  ea);

   oAr- assignedTcapacity ax_Area.mgth, workyees.lenatchingEmplodCount, mirerequn(= Math.mioAssign t t       conses
 ble employe availacount orrequired n up to the     // Assig      );

     
 le === roleemployee?.ro   emp.    => 
    mplter(eloyeePool.fiees = employmatchingEmp  const le
       rohing matcoyees withind empl        // Fe;

inu <= 0) contequiredCount| rnumber' |t !== 'dCounequire(typeof r     if ts)) {
   quiremenoleReries(r.entt] of ObjectequiredCount [role, r (cons      forirements
 role requs based on employee // Assign   0;

   ToArea =ssigned    let a| {};
  ents |_requiremoleworkArea.rments = ireeRequnst rolco) {
      kAreasea of workAr(const wor   for 

 yees];tedEmplo [...selecoyeePool =nst emplco   = [];
  ssignments   const athm
 lgorient agnmo-assi
    // Aut;
nt_id)_id', eve .eq('event  e()
         .delet)
gnments'rk_assiwo    .from('n
  pabaseAdmi    await suvent
s ets for thi assignmenistinglear ex // C }

   ;
   
      })gnment' for assiilablereas ava work aemployees or'No age: mess
         [],data:e,
        rucess: tuc
        s.json({xtResponse   return Neh) {
   as?.lengtkAreh || !worgtlenyees?.edEmploelectf (!s i

     }
  );500 }atus: age }, { stror.messasEror: workArerr false, e({ success:ponse.jsonn NextRes   returror);
    workAreasErareas:',ching work rror fete.error('Esol    con{
  ) Error (workAreas
    ifrue);
tive', teq('is_ac .   d)
  ent_it_id', ev'evenq(
      .eements')e_requirity, rolac, max_cap locationme,'id, na   .select(as')
   rem('work_afro .n
     aseAdmiwait supabError } = arkAreas woerror:rkAreas, t { data: wons
    coentfor this evs  areaorkt w
    // Ge   }
500 });
 , { status:  }.messageyeesErroremplo error: e,