
<?php
$KostenMaxLast = $_POST["KostenMax"];
$KostenMinLast = $_POST["KostenMin"];
$SlaapkamersLast = $_POST["Slaapkamers"];
$RegioLast = $_POST["Regio"];
$TypeLast = $_POST["Type"];
$RichtingTuinLast = $_POST["RichtingTuin"];
$OppHuisMinLast = $_POST["OppervlakteHuisMin"];
$OppHuisMaxLast = $_POST["OppervlakteHuisMax"];
$OppGrondMinLast = $_POST["OppervlakteGrondMin"];
$OppGrondMaxLast = $_POST["OppervlakteGrondMax"];
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT DISTINCT RegioPand FROM panden",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
?>
// Form
<form action="KlantSearch.php" method="post">
Regio:
<select name="Regio" >
<option value='Alle'>Alle</option>
<?php
while(list($Regio) = mysql_fetch_row($resultaat))
{
	if($Regio == $RegioLast){
		print("<option value='$Regio' selected='selected'>$Regio</option>");
	}
	else{
		print("<option value='$Regio'>$Regio</option>");
	}
}
?>
</select><br />


<?php
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT DISTINCT Type FROM panden",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
?>
Type Huis:
<select name="Type">
<option value='Alle'>Alle</option>
<?php
while(list($Type) = mysql_fetch_row($resultaat))
{
	if($Type == $TypeLast){
		print("<option value='$Type' selected='selected'>$Type</option>");
	}
	else{
		print("<option value='$Type'>$Type</option>");
	}
}
?>
</select><br />


<?php
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT DISTINCT RichtingTuin FROM panden",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
?>
Richting Tuin:
<select name="RichtingTuin">
<option value='Alle'>Alle</option>
<?php
while(list($RichtingTuin) = mysql_fetch_row($resultaat))
{
	if($RichtingTuin == $RichtingTuinLast){
		print("<option value='$RichtingTuin' selected='selected'>$RichtingTuin</option>");
	}
	else{
		print("<option value='$RichtingTuin'>$RichtingTuin</option>");
	}
}
?>
</select><br />



maximale kosten:
<?php
print("<input type='number' value='$KostenMaxLast' name='KostenMax' maxlength='7'><br />");
?>
minimale kosten:
<?php
print("<input type='number' value='$KostenMinLast' name='KostenMin' maxlength='7'><br />");
?>
slaapkamers:
<?php
print("<input type='number' value='$SlaapkamersLast' name='Slaapkamers' maxlength='7'><br />");
?>

maximale oppervlakte huis:
<?php
print("<input type='number' value='$OppHuisMaxLast' name='OppervlakteHuisMax' maxlength='7'><br />");
?>
minimale oppervlakte huis:
<?php
print("<input type='number' value='$OppHuisMinLast' name='OppervlakteHuisMin' maxlength='7'><br />");
?>

maximale oppervlakte Grond:
<?php
print("<input type='number' value='$OppGrondMaxLast' name='OppervlakteGrondMax' maxlength='7'><br />");
?>
minimale oppervlakte Grond:
<?php
print("<input type='number' value='$OppGrondMinLast' name='OppervlakteGrondMin' maxlength='7'><br />");
?>

<input type="submit" value="Verzend" />
</form>
//query
<?php
$KostenMax = $_POST["KostenMax"];
$KostenMin = $_POST["KostenMin"];
$Slaapkamers = $_POST["Slaapkamers"];
$Regio = $_POST["Regio"];
$Type = $_POST["Type"];
$RichtingTuin = $_POST["RichtingTuin"];
$OppHuisMin = $_POST["OppervlakteHuisMin"];
$OppHuisMax = $_POST["OppervlakteHuisMax"];
$OppGrondMin = $_POST["OppervlakteGrondMin"];
$OppGrondMax = $_POST["OppervlakteGrondMax"];

if(!$KostenMin){
	$KostenMin = 0;
}
if(!$KostenMax){
	$KostenMax = 99999999;
}

if(!$OppHuisMin){
	$OppHuisMin = 0;
}
if(!$OppHuisMax){
	$OppHuisMax = 99999999;
}

if(!$OppGrondMin){
	$OppGrondMin = 0;
}
if(!$OppGrondMax){
	$OppGrondMax = 99999999;
}

$query = array('1=1');
$query[] =  "Verkoopprijs BETWEEN " . addslashes($KostenMin) . " AND " . addslashes($KostenMax);
if (is_numeric($Slaapkamers)) {
  $query[] = "Slaapkamers = " . "'" . addslashes($Slaapkamers) . "'";
}
if ($Regio != "Alle" && $Regio != NULL)
{
	$query[] = " RegioPand = " . "'" . addslashes($Regio) . "'";
}
if ($Type != "Alle" && $Type != NULL){
	$query[] = "Type = " . "'" . addslashes($Type) . "'";
}
if ($RichtingTuin != "Alle" && $RichtingTuin != NULL){
	$query[] = "RichtingTuin = " . "'" . addslashes($RichtingTuin) . "'";
}
$query[] =  "OppervlakteHuis BETWEEN " . addslashes($OppHuisMin) . " AND " . addslashes($OppHuisMax);

$query[] =  "OppervlakteGrond BETWEEN " . addslashes($OppGrondMin) . " AND " . addslashes($OppGrondMax);

$query = join(" AND ", $query);

$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT * FROM panden Where  $query",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
//print
print("<table><tr><td>PandID</td><td>Pand naam</td><td>VerkoperID</td>
		<td>Verkoop datum</td><td>Inkoopprijs</td><td>Verkoopprijs</td>
		<td>Verkocht?</td><td>RegioPand</td><td>Type</td><td>Plaatje</td>
		<td>Postcode</td><td>Plaats</td><td>Oppervlakte</td><td>Slaapkamers</td>
		<td>Richting tuin</td></tr>");
	 while(list($PandID,$PandNaam,$VerkoperID,$VerkoopDatum,$Inkoopprijs,$Verkoopprijs,$Verkocht,$RegioPand,$Type,$Plaatje,$Postcode,$Plaats,$Oppervlakte,$Slaapkamers,$RichtingTuin) = mysql_fetch_row($resultaat))
	 {
		$Link = "<a href=\"PandDetails.php/?PandID=$PandID\">$PandNaam</a>";
		$Image = "<img src=$Plaatje alt=\"plaatje\" style=\"width:200;height:100;\">";
	  	echo("<tr><td>$PandID</td><td>$Link</td><td>$VerkoperID</td>
		<td>$VerkoopDatum</td><td>$Inkoopprijs</td><td>$Verkoopprijs</td>
		<td>$Verkocht</td><td>$RegioPand</td><td>$Type</td><td>$Image</td>
		<td>$Postcode</td><td>$Plaats</td><td>$Oppervlakte</td><td>$Slaapkamers</td>
		<td>$RichtingTuin</td></tr>");
	 }
print("</table>");

?>
